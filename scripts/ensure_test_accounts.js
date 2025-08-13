const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function uniqSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

(async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ttkh_tourism'
  };

  const accounts = [
    { email: 'admin@ttkh.com', password: 'admin123', role: 'admin', username: 'admin', name: '管理员' },
    { email: 'merchant@test.com', password: '123456', role: 'merchant', username: 'merchant', name: '测试商家', company_name: '测试旅游公司' },
    { email: 'agent@test.com', password: '123456', role: 'agent', username: 'agent', name: '代理' },
    { email: 'user@test.com', password: '123456', role: 'customer', username: 'user', name: '普通用户' }
  ];

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功，开始确保测试账号存在并更新密码/权限...');

    for (const acc of accounts) {
      const hashed = bcrypt.hashSync(acc.password, 10);

      // 1) 查找是否存在相同 email 的用户
      const [byEmail] = await conn.execute('SELECT id, username, email FROM users WHERE email = ?', [acc.email]);
      if (byEmail && byEmail.length > 0) {
        // 在更新 username 前，确保目标 username 不会造成唯一冲突（除非是当前记录本身）
        let targetUsername = acc.username;
        if (byEmail[0].username !== targetUsername) {
          // 检查是否有其他用户占用了 targetUsername
          const [conflict] = await conn.execute('SELECT id FROM users WHERE username = ? AND email <> ?', [targetUsername, acc.email]);
          if (conflict && conflict.length > 0) {
            targetUsername = `${targetUsername}_${uniqSuffix()}`;
            console.log(`用户名冲突：${acc.username}，将改为 ${targetUsername}`);
          }
        } else {
          targetUsername = byEmail[0].username;
        }

        await conn.execute(
          `UPDATE users SET username = ?, password = ?, role = ?, status = 'active', name = ?, company_name = ? WHERE email = ?`,
          [targetUsername, hashed, acc.role, acc.name || null, acc.company_name || null, acc.email]
        );
        console.log(`已更新用户: ${acc.email} (username: ${targetUsername})`);
        continue;
      }

      // 2) 若不存在 email，则确保 username 唯一
      let desiredUsername = acc.username;
      while (true) {
        const [rows] = await conn.execute('SELECT id FROM users WHERE username = ?', [desiredUsername]);
        if (!rows || rows.length === 0) break;
        desiredUsername = `${acc.username}_${uniqSuffix()}`;
      }

      // 3) 插入新用户
      await conn.execute(
        `INSERT INTO users (id, username, email, password, role, status, name, company_name) VALUES (UUID(), ?, ?, ?, ?, 'active', ?, ?)`,
        [desiredUsername, acc.email, hashed, acc.role, acc.name || null, acc.company_name || null]
      );
      console.log(`已创建用户: ${acc.email} (username: ${desiredUsername})`);
    }

    console.log('测试账号处理完成');
  } catch (err) {
    console.error('操作失败:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (conn) {
      try { await conn.end(); } catch (e) {}
    }
  }
})();