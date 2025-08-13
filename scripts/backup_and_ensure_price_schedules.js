const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  const outSql = 'ttkh-tourism-system/price_schedules_backup.json';
  try {
    const conn = await mysql.createConnection(CONF);
    console.log('Connecting to DB...');
    const [rows] = await conn.execute('SELECT * FROM price_schedules');
    fs.writeFileSync(outSql, JSON.stringify({ timestamp: new Date().toISOString(), rows }, null, 2), 'utf8');
    console.log('✅ Backup written to', outSql, 'rows=', rows.length);
    // check column
    const [cols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'price_schedules' AND COLUMN_NAME = 'available_stock'",
      [CONF.database]
    );
    if (!cols || cols.length === 0) {
      console.log('available_stock not found -> adding column');
      await conn.execute('ALTER TABLE price_schedules ADD COLUMN available_stock INT DEFAULT NULL');
      console.log('✅ ALTER TABLE executed: available_stock added');
    } else {
      console.log('✅ Column available_stock already exists');
    }
    await conn.end();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();