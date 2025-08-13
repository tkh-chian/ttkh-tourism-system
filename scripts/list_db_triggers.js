const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

(async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ttkh_tourism'
  };
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功，列出当前 schema 的触发器：', dbConfig.database);
    const [rows] = await conn.execute(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_ORIENTATION, ACTION_TIMING, ACTION_STATEMENT
       FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = ?`, [dbConfig.database]
    );
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('列出触发器失败:', err);
  } finally {
    if (conn) await conn.end();
  }
})();