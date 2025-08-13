const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  const outBackup = 'ttkh-tourism-system/users_backup_pre_columns_complete.json';
  const logFile = 'ttkh-tourism-system/ensure_users_columns_complete.log';

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
    const [users] = await conn.execute('SELECT * FROM users');
    fs.writeFileSync(outBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows: users }, null, 2), 'utf8');
    log('Users backup written:', outBackup, 'rows=', users.length);

    // Ensure created_at
    const [hasCreated] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='created_at'",
      [CONF.database]
    );
    if (!hasCreated || hasCreated.length === 0) {
      log('Adding created_at (nullable DATETIME)...');
      await conn.execute("ALTER TABLE users ADD COLUMN created_at DATETIME NULL");
      log('created_at added');
    } else {
      log('created_at exists');
    }

    // Ensure updated_at
    const [hasUpdated] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='updated_at'",
      [CONF.database]
    );
    if (!hasUpdated || hasUpdated.length === 0) {
      log('Adding updated_at (nullable DATETIME)...');
      await conn.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME NULL");
      log('updated_at added');
    } else {
      log('updated_at exists');
    }

    // Populate created_at from createdAt if available, else NOW()
    log('Populating created_at where NULL or invalid...');
    // First copy only valid createdAt values (non-empty and not the zero-date)
    await conn.execute(
      `UPDATE users
       SET created_at = createdAt
       WHERE (created_at IS NULL OR created_at = '0000-00-00 00:00:00')
         AND createdAt IS NOT NULL AND createdAt <> ''`
    );
    // Then set any remaining NULL/invalid created_at to NOW()
    await conn.execute(
      `UPDATE users
       SET created_at = NOW()
       WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'`
    );
    log('created_at population done');

    // Populate updated_at from updatedAt if available, else NOW()
    log('Populating updated_at where NULL or invalid...');
    // First copy only valid updatedAt values (non-empty and not the zero-date)
    await conn.execute(
      `UPDATE users
       SET updated_at = updatedAt
       WHERE (updated_at IS NULL OR updated_at = '0000-00-00 00:00:00')
         AND updatedAt IS NOT NULL AND updatedAt <> ''`
    );
    // Then set any remaining NULL/invalid updated_at to NOW()
    await conn.execute(
      `UPDATE users
       SET updated_at = NOW()
       WHERE updated_at IS NULL OR updated_at = '0000-00-00 00:00:00'`
    );
    log('updated_at population done');

    // Optional: make columns NOT NULL with defaults if DB supports it
    try {
      await conn.execute("ALTER TABLE users MODIFY created_at DATETIME NOT NULL");
      await conn.execute("ALTER TABLE users MODIFY updated_at DATETIME NOT NULL");
      log('Set created_at/updated_at to NOT NULL');
    } catch (e) {
      log('Could not set NOT NULL (DB may not support altering default), skipping:', e.message);
    }

    // Ensure id is AUTO_INCREMENT if possible (helps INSERTs without explicit id)
    try {
      const [idCol] = await conn.execute(
        "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='id'",
        [CONF.database]
      );
      if (idCol && idCol.length > 0) {
        const extra = idCol[0].EXTRA || '';
        if (!/auto_increment/i.test(extra)) {
          log('Adding AUTO_INCREMENT to users.id...');
          try {
            await conn.execute("ALTER TABLE users MODIFY id INT NOT NULL AUTO_INCREMENT");
            log('users.id set to AUTO_INCREMENT');
          } catch (e) {
            log('Could not set id AUTO_INCREMENT:', e.message);
          }
        } else {
          log('users.id already has AUTO_INCREMENT');
        }
      } else {
        log('users.id column not found, skipping AUTO_INCREMENT step');
      }
    } catch (e) {
      log('Error checking id column:', e.message);
    }

    // Verification
    const [colsAfter] = await conn.execute("SHOW COLUMNS FROM users");
    const [sample] = await conn.execute("SELECT id,email,username,name,createdAt,created_at,updatedAt,updated_at FROM users LIMIT 10");
    fs.appendFileSync(logFile, JSON.stringify({ colsAfter, sample }, null, 2));
    log('Verification saved to', logFile);

    await conn.end();
    log('Completed');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(2);
  }
})();