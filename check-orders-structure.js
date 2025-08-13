const mysql = require('mysql2/promise');

async function checkOrdersStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔍 检查orders表的完整结构...');
    const [result] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('orders表字段结构:');
    result.forEach(column => {
      console.log(`- ${column.COLUMN_NAME}: ${column.COLUMN_TYPE} (${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkOrdersStructure();