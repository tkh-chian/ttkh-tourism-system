const mysql = require('mysql2/promise');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });
  
  try {
    console.log('🔍 检查数据库状态...\n');
    
    // 检查产品5是否存在
    console.log('1. 检查产品5:');
    const [products] = await connection.execute('SELECT * FROM products WHERE id = 5');
    if (products.length > 0) {
      console.log(`   ✅ 产品5存在: ${products[0].title_zh}`);
      console.log(`   📋 商家ID: ${products[0].merchant_id}`);
      console.log(`   💰 基础价格: ${products[0].base_price}`);
    } else {
      console.log('   ❌ 产品5不存在');
    }
    
    // 检查所有产品
    console.log('\n2. 所有产品列表:');
    const [allProducts] = await connection.execute('SELECT id, title_zh, merchant_id, status FROM products LIMIT 10');
    allProducts.forEach(p => {
      console.log(`   产品ID: ${p.id} | 标题: ${p.title_zh} | 商家: ${p.merchant_id} | 状态: ${p.status}`);
    });
    
    // 检查产品5的价格日历
    console.log('\n3. 产品5的价格日历:');
    const [schedules] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = 5');
    if (schedules.length > 0) {
      schedules.forEach(s => {
        console.log(`   日期: ${s.travel_date} | 价格: ${s.price} | 库存: ${s.available_stock}`);
      });
    } else {
      console.log('   ❌ 产品5没有价格日历设置');
    }
    
    // 检查所有价格日历
    console.log('\n4. 所有价格日历:');
    const [allSchedules] = await connection.execute('SELECT product_id, travel_date, price, available_stock FROM price_schedules LIMIT 10');
    allSchedules.forEach(s => {
      console.log(`   产品: ${s.product_id} | 日期: ${s.travel_date} | 价格: ${s.price} | 库存: ${s.available_stock}`);
    });
    
    // 测试日期匹配
    console.log('\n5. 测试日期匹配查询:');
    const testDate = '2025-08-23';
    const [exactMatch] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = 5 AND travel_date = ?', [testDate]);
    console.log(`   精确匹配 (${testDate}): ${exactMatch.length} 条记录`);
    
    const [dateMatch] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = 5 AND DATE(travel_date) = ?', [testDate]);
    console.log(`   DATE()匹配 (${testDate}): ${dateMatch.length} 条记录`);
    
    // 如果有数据，显示第一条的详细信息
    if (allSchedules.length > 0) {
      const firstSchedule = allSchedules[0];
      const testDate2 = firstSchedule.travel_date.toISOString().split('T')[0];
      console.log(`\n6. 测试实际存在的日期 (${testDate2}):`);
      
      const [exactMatch2] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = ? AND travel_date = ?', [firstSchedule.product_id, firstSchedule.travel_date]);
      console.log(`   精确匹配: ${exactMatch2.length} 条记录`);
      
      const [dateMatch2] = await connection.execute('SELECT * FROM price_schedules WHERE product_id = ? AND DATE(travel_date) = ?', [firstSchedule.product_id, testDate2]);
      console.log(`   DATE()匹配: ${dateMatch2.length} 条记录`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabase();