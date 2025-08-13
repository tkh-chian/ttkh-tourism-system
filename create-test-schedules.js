const mysql = require('mysql2/promise');

async function createTestSchedules() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });
  
  try {
    console.log('🔧 为产品5创建测试价格日历...\n');
    
    // 检查产品5是否存在
    const [products] = await connection.execute('SELECT * FROM products WHERE id = 5');
    if (products.length === 0) {
      console.log('❌ 产品5不存在，无法创建价格日历');
      return;
    }
    
    console.log(`✅ 产品5存在: ${products[0].title_zh}`);
    
    // 创建未来30天的价格日历
    const schedules = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      schedules.push({
        product_id: 5,
        travel_date: date.toISOString().split('T')[0],
        price: 1000 + (i * 50), // 价格递增
        total_stock: 20,
        available_stock: 20
      });
    }
    
    console.log(`📅 准备创建 ${schedules.length} 条价格日历记录...\n`);
    
    // 批量插入价格日历
    for (const schedule of schedules) {
      try {
        await connection.execute(`
          INSERT INTO price_schedules (product_id, travel_date, price, total_stock, available_stock, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          price = VALUES(price),
          total_stock = VALUES(total_stock),
          available_stock = VALUES(available_stock),
          updated_at = NOW()
        `, [schedule.product_id, schedule.travel_date, schedule.price, schedule.total_stock, schedule.available_stock]);
        
        console.log(`   ✅ ${schedule.travel_date} - ¥${schedule.price} (库存: ${schedule.available_stock})`);
      } catch (error) {
        console.log(`   ❌ ${schedule.travel_date} 创建失败: ${error.message}`);
      }
    }
    
    // 验证创建结果
    console.log('\n🔍 验证创建结果:');
    const [newSchedules] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = 5 ORDER BY travel_date LIMIT 5');
    newSchedules.forEach(s => {
      console.log(`   ${s.travel_date} | ¥${s.price} | 库存: ${s.available_stock}`);
    });
    
    console.log(`\n🎉 成功为产品5创建了价格日历！`);
    
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
  } finally {
    await connection.end();
  }
}

createTestSchedules();