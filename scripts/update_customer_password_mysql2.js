const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

(async () => {
  try {
    // 读取后端 .env
    const envPath = path.join(__dirname, '..', 'backend', '.env');
    const envRaw = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envRaw.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([\w_]+)=(.*)$/);
      if (m) {
        env[m[1]] = m[2];
      }
    });

    const DB_HOST = env.DB_HOST || env.MYSQL_HOST || '127.0.0.1';
    const DB_PORT = env.DB_PORT || env.MYSQL_PORT || 3306;
    const DB_USER = env.DB_USER || env.MYSQL_USER || 'root';
    const DB_PASS = env.DB_PASSWORD || env.DB_PASS || env.MYSQL_PASSWORD || env.MYSQL_PASS || '';
    const DB_NAME = env.DB_NAME || env.MYSQL_DATABASE || 'ttkh';

    console.log('Connecting to MySQL %s@%s:%s / %s', DB_USER, DB_HOST, DB_PORT, DB_NAME);
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    const passwordPlain = '123456';
    const hash = await bcrypt.hash(passwordPlain, 10);

    // 优先更新 username = 'customer'
    const [result] = await conn.execute(
      `UPDATE users SET password = ? WHERE username = ? OR email = ?`,
      [hash, 'customer', 'customer@test.com']
    );

    console.log('Update result:', result.affectedRows, 'rows affected');

    if (result.affectedRows === 0) {
      // 如果没有更新到记录，尝试插入用户（幂等）
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await conn.execute(
        `INSERT INTO users (id, username, email, password, role, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'customer', 'customer@test.com', hash, 'customer', 'active', now, now]
      );
      console.log('Inserted test customer user with id', id);
    }

    await conn.end();
    console.log('Password update script completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating customer password:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();