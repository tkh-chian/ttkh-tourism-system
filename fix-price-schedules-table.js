const mysql = require('mysql2/promise');

async function fixPriceSchedulesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 修复 price_schedules 表的 id 字段类型
    console.log('🔧 修复 price_schedules 表 id 字段类型...');
    await connection.execute(`
      ALTER TABLE price_schedules 
      MODIFY COLUMN id VARCHAR(36) NOT NULL
    `);

    console.log('✅ price_schedules 表 id 字段修复完成！');

    // 验证修复结果
    console.log('🔍 验证修复结果...');
    const [tableInfo] = await connection.execute(`
      DESCRIBE price_schedules
    `);
    
    console.log('📋 price_schedules 表字段:');
    tableInfo.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default || ''}`);
    });

    // 测试插入UUID
    console.log('\n🧪 测试UUID插入...');
    const testId = 'test-uuid-' + Date.now();
    const testProductId = 'test-product-uuid-' + Date.now();
    
    try {
      await connection.execute(`
        INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testId, testProductId, '2025-01-15', 1000, 10, 10]);
      
      console.log('✅ UUID插入成功');
      
      // 清理测试数据
      await connection.execute('DELETE FROM price_schedules WHERE id = ?', [testId]);
      console.log('🧹 测试数据已清理');
      
    } catch (error) {
      console.error('❌ UUID插入失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

fixPriceSchedulesTable().catch(console.error);