const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixOrdersStatusField() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接到MySQL数据库');

    // 检查当前status字段类型
    const [rows] = await connection.execute('DESCRIBE orders');
    const statusField = rows.find(row => row.Field === 'status');
    console.log(`当前status字段类型: ${statusField.Type}`);

    // 修改orders表的status字段为varchar(20)
    await connection.execute(`
      ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending'
    `);
    console.log('✅ 修复orders表status字段长度为VARCHAR(20)');

    // 验证修改结果
    const [newRows] = await connection.execute('DESCRIBE orders');
    const newStatusField = newRows.find(row => row.Field === 'status');
    console.log(`✅ 修复后status字段类型: ${newStatusField.Type}`);

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

fixOrdersStatusField();