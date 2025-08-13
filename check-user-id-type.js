const mysql = require('mysql2/promise');

async function checkUserIdType() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔍 检查users表的id字段类型...');
    
    const [rows] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'id'
    `);
    
    console.log('users表id字段信息:');
    console.log(rows[0]);
    
    console.log('\n🔍 检查orders表中所有外键字段类型...');
    const [orderRows] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME IN ('customer_id', 'merchant_id', 'agent_id', 'product_id')
    `);
    
    console.log('orders表外键字段信息:');
    orderRows.forEach(row => {
      console.log(`- ${row.COLUMN_NAME}: ${row.COLUMN_TYPE}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkUserIdType();