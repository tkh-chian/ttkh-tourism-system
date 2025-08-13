const mysql = require('mysql2/promise');

(async () => {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    port: 3306,
    database: 'ttkh_tourism'
  };

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功（直接 DB 配置），检查 users.agent_id 列...');

    const [rows] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'agent_id'`,
      [dbConfig.database]
    );

    if (rows[0].cnt === 0) {
      console.log('users.agent_id 不存在，添加列 agent_id ...');
      await conn.query(`ALTER TABLE users ADD COLUMN agent_id CHAR(36) NULL AFTER email`);
      console.log('已添加 users.agent_id');
    } else {
      console.log('users.agent_id 已存在，跳过添加');
    }
  } catch (err) {
    console.error('操作失败:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (conn) {
      try { await conn.end(); } catch (e) {}
      console.log('数据库连接已关闭');
    }
  }
})();