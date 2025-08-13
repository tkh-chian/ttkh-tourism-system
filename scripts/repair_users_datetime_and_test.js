const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function run() {
  let conn;
  try {
    console.log('开始备份并修复 users 表...');
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ttkh_tourism'
    };
    conn = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 调试钩子：拦截 execute/query，记录每次实际发送到 mysql2 的 SQL 与参数到文件 last_executed_sql.txt
    (function attachSqlLogger(connection) {
      try {
        const origExecute = connection.execute.bind(connection);
        const origQuery = connection.query ? connection.query.bind(connection) : null;
        connection.execute = async function(sql, params) {
          try {
            fs.writeFileSync(path.join(__dirname, 'last_executed_sql.txt'), `SQL:\\n${sql}\\nPARAMS:\\n${JSON.stringify(params)}\\n`, 'utf8');
          } catch (e) {
            // 忽略日志写入错误
          }
          return origExecute(sql, params);
        };
        if (origQuery) {
          connection.query = async function(sql, params) {
            try {
              fs.appendFileSync(path.join(__dirname, 'last_executed_sql.txt'), `\\nQUERY:\\n${sql}\\nPARAMS:\\n${JSON.stringify(params)}\\n`);
            } catch (e) {}
            return origQuery(sql, params);
          };
        }
      } catch (err) {
        // 不影响主流程
        console.error('attachSqlLogger error:', err && err.message);
      }
    })(conn);

    // 1) 备份 users 表
    console.log('导出当前 users 表到 scripts/users_backup_auto.json ...');
    const [rows] = await conn.execute('SELECT * FROM users');
    fs.writeFileSync(path.join(__dirname, 'users_backup_auto.json'), JSON.stringify(rows, null, 2), 'utf8');
    console.log('备份完成: scripts/users_backup_auto.json （记录数：' + rows.length + '）');

    // 2) 清理异常 DATETIME 值（空字符串或 zero-date）
console.log('清理异常 DATETIME（将空字符串或 0000-00-00 00:00:00 转为 NULL）...');
await conn.execute("UPDATE users SET createdAt = NULL WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL OR CAST(createdAt AS CHAR) = ''");
await conn.execute("UPDATE users SET updatedAt = NULL WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL OR CAST(updatedAt AS CHAR) = ''");

    // 3) 修改表结构，确保默认值与 NULL 支持
    console.log('修改 users 表的 createdAt / updatedAt 字段属性...');
    await conn.execute(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      MODIFY COLUMN updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('表结构修改完成');

// 4) 再次清理：把可能仍然存在的 '' 值设为 NULL（保险）
await conn.execute("UPDATE users SET createdAt = NULL WHERE createdAt IS NULL OR CAST(createdAt AS CHAR) = ''");
await conn.execute("UPDATE users SET updatedAt = NULL WHERE updatedAt IS NULL OR CAST(updatedAt AS CHAR) = ''");

    // 5) 插入测试用户（参数化）
    console.log('插入测试用户以验证写入与时间戳...');
    const id = uuidv4();
    const username = `testuser_${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@example.com`;
    const password_hash = bcrypt.hashSync('password123', 10);
    const data = {
      id,
      username,
      email,
      password: password_hash,
      role: 'customer',
      status: 'active',
      phone: '1234567890'
      // 不显式 createdAt/updatedAt，使用数据库默认
    };
    // 将最终准备插入的 payload 写入文件，便于调试确认没有 createdAt/updatedAt = ''
    fs.writeFileSync(path.join(__dirname, 'last_insert_payload.json'), JSON.stringify(data, null, 2), 'utf8');

    // 使用显式列清单的参数化 INSERT，避免使用 SET ? 时展开对象带来的隐式空字符串问题
    const columns = ['id','username','email','password','role','status','phone'];
    const values = [id, username, email, password_hash, 'customer', 'active', '1234567890'];
    const placeholders = columns.map(() => '?').join(',');
    const [insertResult] = await conn.execute(`INSERT INTO users (${columns.join(',')}) VALUES (${placeholders})`, values);
    console.log('插入结果:', insertResult);

    // 6) 验证插入并显示 createdAt/updatedAt
    const [users] = await conn.execute('SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [id]);
    if (users && users.length > 0) {
      console.log('查询到测试用户：', users[0]);
    } else {
      console.log('未能查询到刚插入的用户，插入可能失败');
    }

    console.log('修复脚本完成');
  } catch (err) {
    console.error('操作失败:', err);
  } finally {
    if (conn) {
      try { await conn.end(); } catch (e) {}
      console.log('数据库连接已关闭');
    }
  }
}

run();