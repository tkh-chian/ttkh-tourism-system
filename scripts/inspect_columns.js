const mysql = require('mysql2/promise');

(async () => {
  const cfg = {
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism',
    port: 3306
  };

  let conn;
  try {
    conn = await mysql.createConnection(cfg);
    const sql = `
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_KEY, EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'ttkh_tourism'
        AND TABLE_NAME IN ('users','cart','products')
      ORDER BY TABLE_NAME, ORDINAL_POSITION;
    `;
    const [rows] = await conn.execute(sql);
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e && e.message);
    if (conn) await conn.end();
    process.exit(1);
  }
})();