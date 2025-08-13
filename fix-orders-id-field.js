const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixOrdersIdField() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接到MySQL数据库');

    // 修改orders表的id字段为varchar(36)以支持UUID
    await connection.execute(`
      ALTER TABLE orders MODIFY COLUMN id VARCHAR(36) NOT NULL
    `);
    console.log('✅ 修复orders表id字段长度');

    // 验证修改结果
    const [rows] = await connection.execute('DESCRIBE orders');
    const idField = rows.find(row => row.Field === 'id');
    console.log(`✅ orders表id字段类型: ${idField.Type}`);

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

fixOrdersIdField();