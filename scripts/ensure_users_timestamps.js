const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  const outBackup = 'ttkh-tourism-system/users_backup_pre_timestamps.json';
  const logFile = 'ttkh-tourism-system/ensure_users_timestamps.log';
  function log(...args){ const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`; fs.appendFileSync(logFile,line,'utf8'); console.log(...args); }
  let conn;
  try {
    conn = await mysql.createConnection(CONF);
    log('Connected to DB');
    const [users] = await conn.execute('SELECT * FROM users');
    fs.writeFileSync(outBackup, JSON.stringify({ timestamp: new Date().toISOString(), rows: users }, null, 2), 'utf8');
    log('Users backup written:', outBackup, 'rows=', users.length);

    // check created_at
    const [createdCol] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'",
      [CONF.database]
    );
    const [updatedCol] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at'",
      [CONF.database]
    );

    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    if (!createdCol || createdCol.length === 0) {
      log('Adding created_at to users...');
      try {
        await conn.execute("ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
      } catch (e) {
        await conn.execute("ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL");
        await conn.execute("UPDATE users SET created_at = ? WHERE created_at IS NULL", [now]);
      }
      log('created_at added');
      // copy from createdAt if exists
      const [hasCamelCreated] = await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='createdAt'", [CONF.database]);
      if (hasCamelCreated && hasCamelCreated.length > 0) {
        log('Copying createdAt -> created_at for rows where created_at IS NULL or zero...');
        await conn.execute("UPDATE users SET created_at = createdAt WHERE (created_at IS NULL OR created_at = '') AND createdAt IS NOT NULL");
        log('Copy complete');
      }
    } else {
      log('created_at already exists');
    }

    if (!updatedCol || updatedCol.length === 0) {
      log('Adding updated_at to users...');
      try {
        await conn.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      } catch (e) {
        await conn.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL");
        await conn.execute("UPDATE users SET updated_at = ? WHERE updated_at IS NULL", [now]);
      }
      log('updated_at added');
      const [hasCamelUpdated] = await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='updatedAt'", [CONF.database]);
      if (hasCamelUpdated && hasCamelUpdated.length > 0) {
        log('Copying updatedAt -> updated_at where appropriate...');
        await conn.execute("UPDATE users SET updated_at = updatedAt WHERE (updated_at IS NULL OR updated_at = '') AND updatedAt IS NOT NULL");
        log('Copy complete');
      }
    } else {
      log('updated_at already exists');
    }

    // verification
    const [colsAfter] = await conn.execute("SHOW COLUMNS FROM users");
    const [sample] = await conn.execute("SELECT id,email,username,name,createdAt,created_at,updatedAt,updated_at FROM users LIMIT 5");
    fs.appendFileSync(logFile, JSON.stringify({ colsAfter, sample }, null, 2));
    console.log('VERIFICATION_SAVED to', logFile);
    await conn.end();
    log('Done');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(2);
  }
})();