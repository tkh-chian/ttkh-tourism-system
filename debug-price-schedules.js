const mysql = require('mysql2/promise');

async function debugPriceSchedules() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 检查 price_schedules 表结构
    console.log('🔍 检查 price_schedules 表结构...');
    const [tableInfo] = await connection.execute(`
      DESCRIBE price_schedules
    `);
    
    console.log('📋 price_schedules 表字段:');
    tableInfo.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default || ''}`);
    });

    // 检查索引
    console.log('\n🔍 检查 price_schedules 表索引...');
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM price_schedules
    `);
    
    console.log('📋 price_schedules 表索引:');
    indexes.forEach(index => {
      console.log(`  ${index.Key_name}: ${index.Column_name} (${index.Non_unique ? '非唯一' : '唯一'})`);
    });

    // 测试简单插入
    console.log('\n🧪 测试简单插入...');
    const testId = 'test-' + Date.now();
    const testProductId = 'test-product-' + Date.now();
    
    try {
      await connection.execute(`
        INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testId, testProductId, '2025-01-15', 1000, 10, 10]);
      
      console.log('✅ 简单插入成功');
      
      // 清理测试数据
      await connection.execute('DELETE FROM price_schedules WHERE id = ?', [testId]);
      console.log('🧹 测试数据已清理');
      
    } catch (error) {
      console.error('❌ 简单插入失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

debugPriceSchedules().catch(console.error);