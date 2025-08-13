const mysql = require('mysql2/promise');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

(async () => {
  const DB_CONF = {
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  };

  const EMAIL = 'merchant@test.com';
  const NEW_PLAIN = 'merchant123';

  const outBackup = 'ttkh-tourism-system/merchant-backup.json';
  const outCols = 'ttkh-tourism-system/users-columns.json';

  const connection = await mysql.createConnection(DB_CONF);
  try {
    console.log('=== 备份 users 列定义 ===');
    const [cols] = await connection.execute("SHOW COLUMNS FROM users");
    fs.writeFileSync(outCols, JSON.stringify(cols, null, 2), 'utf8');
    console.log(`✅ 列定义已保存: ${outCols}`);

    console.log('\n=== 备份当前用户行 (SELECT *) ===');
    const [rows] = await connection.execute("SELECT * FROM users WHERE email = ?", [EMAIL]);
    fs.writeFileSync(outBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows }, null, 2), 'utf8');
    console.log(`✅ 备份已写入: ${outBackup} (rows=${rows.length})`);

    const hashed = await bcrypt.hash(NEW_PLAIN, 10);

    if (rows.length > 0) {
      console.log('\n=== 用户存在：尝试使用 UPDATE 修改 password 与 status ===');
      // 优先只更新 password 和 status，如果字段存在
      const colNames = cols.map(c => c.Field);
      const updates = [];
      const params = [];

      if (colNames.includes('password')) {
        updates.push('password = ?');
        params.push(hashed);
      } else if (colNames.includes('password_hash')) {
        updates.push('password_hash = ?');
        params.push(hashed);
      } else {
        console.warn('⚠️ 未找到 password/password_hash 字段，跳过密码更新（不推荐）');
      }

      if (colNames.includes('status')) {
        updates.push("status = 'approved'");
      }

      if (updates.length > 0) {
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE email = ?`;
        params.push(EMAIL);
        const [res] = await connection.execute(sql, params);
        console.log(`✅ UPDATE 执行，影响行数: ${res.affectedRows}`);
      } else {
        console.log('ℹ️ 无可更新列，跳过 UPDATE 步骤');
      }
    } else {
      console.log('\n=== 用户不存在：构建 INSERT（仅使用表中存在的列） ===');
      const colNames = cols.map(c => c.Field);
      const insertCols = [];
      const insertVals = [];
      const params = [];

      // 常用字段优先填充
      if (colNames.includes('id')) {
        insertCols.push('id');
        insertVals.push('?');
        params.push(uuidv4());
      }
      if (colNames.includes('username')) {
        insertCols.push('username');
        insertVals.push('?');
        params.push('测试商家');
      }
      if (colNames.includes('email')) {
        insertCols.push('email');
        insertVals.push('?');
        params.push(EMAIL);
      }
      if (colNames.includes('password')) {
        insertCols.push('password');
        insertVals.push('?');
        params.push(hashed);
      } else if (colNames.includes('password_hash')) {
        insertCols.push('password_hash');
        insertVals.push('?');
        params.push(hashed);
      }
      if (colNames.includes('role')) {
        insertCols.push('role');
        insertVals.push('?');
        params.push('merchant');
      }
      if (colNames.includes('status')) {
        insertCols.push('status');
        insertVals.push('?');
        params.push('approved');
      }
      // createdAt/created_at and updatedAt/updated_at handling
      const nowTs = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (colNames.includes('createdAt') && !insertCols.includes('createdAt')) {
        insertCols.push('createdAt');
        insertVals.push('?');
        params.push(nowTs);
      } else if (colNames.includes('created_at') && !insertCols.includes('created_at')) {
        insertCols.push('created_at');
        insertVals.push('?');
        params.push(nowTs);
      }
      if (colNames.includes('updatedAt') && !insertCols.includes('updatedAt')) {
        insertCols.push('updatedAt');
        insertVals.push('?');
        params.push(nowTs);
      } else if (colNames.includes('updated_at') && !insertCols.includes('updated_at')) {
        insertCols.push('updated_at');
        insertVals.push('?');
        params.push(nowTs);
      }

      if (insertCols.length === 0) {
        throw new Error('无法构建 INSERT：表缺少可写列（id/username/email/password 等）');
      }

      const sql = `INSERT INTO users (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`;
      const [res] = await connection.execute(sql, params);
      console.log(`✅ INSERT 执行成功，insertId/affectedRows: ${res.affectedRows || res.insertId}`);
    }

    // 验证：读取当前行并校验 bcrypt
    console.log('\n=== 验证：读取并对比哈希 ===');
    const [after] = await connection.execute("SELECT * FROM users WHERE email = ?", [EMAIL]);
    if (after.length === 0) {
      console.log(`❌ 验证失败：仍未找到 ${EMAIL}`);
    } else {
      const user = after[0];
      // 尝试找出密码字段名
      let pwdField = null;
      if (user.password !== undefined) pwdField = 'password';
      else if (user.password_hash !== undefined) pwdField = 'password_hash';
      else {
        // try common variants
        for (const k of Object.keys(user)) {
          if (k.toLowerCase().includes('pass')) { pwdField = k; break; }
        }
      }

      if (pwdField) {
        const isValid = await bcrypt.compare(NEW_PLAIN, user[pwdField]);
        console.log(`✅ 密码验证: ${isValid ? '成功' : '失败'} (字段: ${pwdField})`);
        console.log('用户信息:', user);
      } else {
        console.log('⚠️ 未找到密码字段，无法校验哈希。用户行如下：', user);
      }
    }

    console.log('\n=== 过程完成。备份文件:', outBackup, '列定义文件:', outCols, '==='); 
  } catch (err) {
    console.error('❌ 运行过程中出错:', err.message);
    console.error(err);
    process.exit(2);
  } finally {
    await connection.end();
  }
})();