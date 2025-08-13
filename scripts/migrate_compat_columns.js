const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  const outDir = 'ttkh-tourism-system';
  const usersBackup = `${outDir}/users_backup.json`;
  const psBackup = `${outDir}/price_schedules_backup.json`;
  const logFile = `${outDir}/migration-compat.log`;

  function log(...args){
    const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
    fs.appendFileSync(logFile, line, 'utf8');
    console.log(...args);
  }

  let conn;
  try {
    conn = await mysql.createConnection(CONF);
    log('Connected to DB');

    // Backup users
    log('Backing up users...');
    const [users] = await conn.execute('SELECT * FROM users');
    fs.writeFileSync(usersBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows: users }, null, 2), 'utf8');
    log('Users backup written:', usersBackup, 'rows=', users.length);

    // Backup price_schedules
    log('Backing up price_schedules...');
    const [ps] = await conn.execute('SELECT * FROM price_schedules');
    fs.writeFileSync(psBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows: ps }, null, 2), 'utf8');
    log('Price schedules backup written:', psBackup, 'rows=', ps.length);

    // Ensure users.password_hash exists
    log('Checking users table for password_hash column...');
    const [uCols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'",
      [CONF.database]
    );
    if (!uCols || uCols.length === 0) {
      log('Adding password_hash column to users (nullable)...');
      await conn.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL");
      log('password_hash column added');
      // Copy password -> password_hash if password exists and password_hash null
      log('Copying password -> password_hash for existing rows (only where password_hash IS NULL)...');
      await conn.execute("UPDATE users SET password_hash = password WHERE password_hash IS NULL");
      log('Copy complete');
    } else {
      log('password_hash already exists');
    }

    // Ensure price_schedules created_at/updated_at exist
    log('Checking price_schedules for created_at/updated_at...');
    const [psCreated] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'price_schedules' AND COLUMN_NAME = 'created_at'",
      [CONF.database]
    );
    const [psUpdated] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'price_schedules' AND COLUMN_NAME = 'updated_at'",
      [CONF.database]
    );

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (!psCreated || psCreated.length === 0) {
      log('Adding created_at (datetime NOT NULL DEFAULT CURRENT_TIMESTAMP) to price_schedules...');
      try {
        await conn.execute("ALTER TABLE price_schedules ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
      } catch (e) {
        // fallback for MySQL versions without CURRENT_TIMESTAMP on DATETIME
        await conn.execute("ALTER TABLE price_schedules ADD COLUMN created_at DATETIME NOT NULL");
        await conn.execute("UPDATE price_schedules SET created_at = ? WHERE created_at IS NULL", [now]);
      }
      log('created_at added');
    } else {
      log('created_at exists');
    }

    if (!psUpdated || psUpdated.length === 0) {
      log('Adding updated_at (datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) to price_schedules...');
      try {
        await conn.execute("ALTER TABLE price_schedules ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      } catch (e) {
        await conn.execute("ALTER TABLE price_schedules ADD COLUMN updated_at DATETIME NOT NULL");
        await conn.execute("UPDATE price_schedules SET updated_at = ? WHERE updated_at IS NULL", [now]);
      }
      log('updated_at added');
    } else {
      log('updated_at exists');
    }

    // Ensure available_stock exists (double-check)
    log('Ensuring available_stock column exists...');
    const [psStock] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'price_schedules' AND COLUMN_NAME = 'available_stock'",
      [CONF.database]
    );
    if (!psStock || psStock.length === 0) {
      await conn.execute("ALTER TABLE price_schedules ADD COLUMN available_stock INT DEFAULT NULL");
      log('available_stock added');
    } else {
      log('available_stock exists');
    }

    // Final verification sample
    log('Final verification: sample rows and columns');
    const [uColsAfter] = await conn.execute("SHOW COLUMNS FROM users");
    const [psColsAfter] = await conn.execute("SHOW COLUMNS FROM price_schedules");
    const [uSample] = await conn.execute("SELECT id, email, password, password_hash, status FROM users LIMIT 5");
    const [psSample] = await conn.execute("SELECT id, product_id, date, price, available_stock, created_at, updated_at FROM price_schedules LIMIT 5");

    fs.appendFileSync(logFile, JSON.stringify({ uColsAfter, psColsAfter, uSample, psSample }, null, 2));
    console.log('VERIFICATION_SAVED to', logFile);

    await conn.end();
    log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(2);
  }
})();