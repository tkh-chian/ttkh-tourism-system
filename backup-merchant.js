const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    const [rows] = await connection.execute(
      "SELECT id, username, email, role, status, password, created_at, updated_at FROM users WHERE email = 'merchant@test.com'"
    );

    const out = {
      timestamp: new Date().toISOString(),
      rows: rows
    };

    fs.writeFileSync('ttkh-tourism-system/merchant-backup.json', JSON.stringify(out, null, 2), 'utf8');
    console.log('✅ 备份已写入: ttkh-tourism-system/merchant-backup.json');
    if (rows.length === 0) {
      console.log('ℹ️ 未找到 merchant@test.com（backup 文件包含空 rows 数组）');
    } else {
      console.log(`ℹ️ 备份包含 ${rows.length} 行`);
    }
  } catch (err) {
    console.error('❌ 备份过程中出错:', err.message);
    process.exit(2);
  } finally {
    await connection.end();
  }
})();