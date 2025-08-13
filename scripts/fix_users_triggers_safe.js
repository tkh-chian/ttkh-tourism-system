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
    console.log('数据库连接成功，开始替换 users 表的触发器为安全版本...');

    // 删除旧触发器（如果存在）
    await conn.query('DROP TRIGGER IF EXISTS users_before_insert');
    await conn.query('DROP TRIGGER IF EXISTS users_before_update');
    console.log('已删除旧触发器（如果存在）');

    // 创建新的 BEFORE INSERT 触发器（不再使用比较到空字符串的条件）
    await conn.query(`
      CREATE TRIGGER users_before_insert
      BEFORE INSERT ON users
      FOR EACH ROW
      BEGIN
        IF NEW.id IS NULL OR NEW.id = '' THEN
          SET NEW.id = UUID();
        END IF;

        IF (NEW.username IS NULL OR NEW.username = '') THEN
          IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
            SET NEW.username = SUBSTRING_INDEX(NEW.email, '@', 1);
          ELSE
            SET NEW.username = REPLACE(UUID(), '-', '');
          END IF;

        END IF;
        -- 只使用 IS NULL 检查，避免与空字符串比较导致 DATETIME 错误
        IF NEW.createdAt IS NULL THEN
          SET NEW.createdAt = NOW();
        END IF;

        IF NEW.updatedAt IS NULL THEN
          SET NEW.updatedAt = NOW();
        END IF;
      END
    `);
    console.log('已创建安全的 BEFORE INSERT 触发器');

    // 创建新的 BEFORE UPDATE 触发器（只更新 updatedAt）
    await conn.query(`
      CREATE TRIGGER users_before_update
      BEFORE UPDATE ON users
      FOR EACH ROW
      BEGIN
        SET NEW.updatedAt = NOW();
      END
    `);
    console.log('已创建安全的 BEFORE UPDATE 触发器');

    console.log('触发器替换完成');
  } catch (err) {
    console.error('操作失败:', err && err.message ? err.message : err);
  } finally {
    if (conn) {
      try { await conn.end(); } catch (_) {}
      console.log('数据库连接已关闭');
    }
  }
})();