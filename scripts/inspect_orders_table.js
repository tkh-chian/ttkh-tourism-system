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
    console.log('数据库连接成功 - Inspect orders table');

    const [createRows] = await conn.execute('SHOW CREATE TABLE orders');
    console.log('--- SHOW CREATE TABLE orders ---');
    console.log(JSON.stringify(createRows, null, 2));

    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    console.log('--- COLUMNS ---');
    console.log(JSON.stringify(cols, null, 2));

    const [triggers] = await conn.execute("SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING, ACTION_STATEMENT FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = 'orders'", [dbConfig.database]);
    console.log('--- TRIGGERS ---');
    console.log(JSON.stringify(triggers, null, 2));
  } catch (err) {
    console.error('Inspect failed:', err && err.message ? err.message : err);
  } finally {
    if (conn) await conn.end();
    console.log('done');
  }
})();