const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  const outBackup = 'ttkh-tourism-system/users_backup_pre_name.json';
  try {
    const conn = await mysql.createConnection(CONF);
    console.log('Connected to DB');

    // Backup users
    const [users] = await conn.execute('SELECT * FROM users');
    fs.writeFileSync(outBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows: users }, null, 2), 'utf8');
    console.log('✅ Users backup written:', outBackup, 'rows=', users.length);

    // Check column
    const [cols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name'",
      [CONF.database]
    );

    if (!cols || cols.length === 0) {
      console.log('name column not found -> adding column');
      await conn.execute("ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL");
      console.log('✅ ALTER executed: name added');
      // copy username -> name where name is null
      console.log('Copying username -> name for existing rows where name IS NULL');
      await conn.execute("UPDATE users SET name = username WHERE (name IS NULL OR name = '')");
      console.log('✅ Copy complete');
    } else {
      console.log('name column already exists');
    }

    // verification sample
    const [sample] = await conn.execute("SELECT id, username, name, email FROM users LIMIT 5");
    console.log('Sample rows:', JSON.stringify(sample, null, 2));

    await conn.end();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();