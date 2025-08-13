const mysql = require('mysql2/promise');

(async () => {
  const CONF = { host: 'localhost', user: 'root', password: 'Lhjr@170103', database: 'ttkh_tourism' };
  let conn;
  try {
    conn = await mysql.createConnection(CONF);
    console.log('Connected to DB');

    console.log('1) Showing problematic rows (created_at/updated_at NULL or empty):');
    const [problems] = await conn.execute(`
      SELECT id, email, createdAt, created_at, updatedAt, updated_at
      FROM users
      WHERE created_at IS NULL OR created_at = '' OR created_at = '0000-00-00 00:00:00'
         OR updated_at IS NULL OR updated_at = '' OR updated_at = '0000-00-00 00:00:00'
      LIMIT 50
    `);
    console.log('Problem rows (sample):', problems);

    console.log('2) Updating created_at where empty: prefer createdAt, fallback NOW()');
    const [res1] = await conn.execute(`
      UPDATE users
      SET created_at = CASE WHEN COALESCE(NULLIF(createdAt, ''), '') <> '' THEN createdAt ELSE NOW() END
      WHERE created_at IS NULL OR created_at = '' OR created_at = '0000-00-00 00:00:00'
    `);
    console.log('Updated created_at rows affected:', res1.affectedRows);

    console.log('3) Updating updated_at where empty: prefer updatedAt, fallback NOW()');
    const [res2] = await conn.execute(`
      UPDATE users
      SET updated_at = CASE WHEN COALESCE(NULLIF(updatedAt, ''), '') <> '' THEN updatedAt ELSE NOW() END
      WHERE updated_at IS NULL OR updated_at = '' OR updated_at = '0000-00-00 00:00:00'
    `);
    console.log('Updated updated_at rows affected:', res2.affectedRows);

    console.log('4) Verification sample:');
    const [after] = await conn.execute("SELECT id,email,createdAt,created_at,updatedAt,updated_at FROM users LIMIT 10");
    console.log(after);

    await conn.end();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    if (conn) await conn.end();
    process.exit(2);
  }
})();