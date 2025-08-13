const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixTimezoneDateMatching() {
  console.log('🔧 修复时区日期匹配问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查当前价格日历的日期
    console.log('\n1️⃣ 检查当前价格日历日期...');
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        travel_date,
        DATE(travel_date) as date_only,
        TIME(travel_date) as time_only,
        price,
        available_stock
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, ['23380210-a457-4dd7-aa92-6995ff3c2e2b']);
    
    console.log('当前价格日历:');
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.travel_date} (日期部分: ${schedule.date_only.toISOString().split('T')[0]})`);
    });
    
    // 2. 修复日期存储 - 确保日期部分正确
    console.log('\n2️⃣ 修复日期存储...');
    
    const correctDates = [
      '2025-08-21',
      '2025-08-22', 
      '2025-08-28',
      '2025-08-29'
    ];
    
    // 删除现有记录
    await connection.execute(`
      DELETE FROM price_schedules WHERE product_id = ?
    `, ['23380210-a457-4dd7-aa92-6995ff3c2e2b']);
    
    console.log('✅ 删除现有价格日历记录');
    
    // 重新插入正确的日期
    const { v4: uuidv4 } = require('uuid');
    
    for (const date of correctDates) {
      const scheduleId = uuidv4();
      await connection.execute(`
        INSERT INTO price_schedules (
          id, product_id, travel_date, price, total_stock, available_stock, is_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [scheduleId, '23380210-a457-4dd7-aa92-6995ff3c2e2b', date, 1232.00, 20, 20, 1]);
      
      console.log(`✅ 插入日期: ${date}`);
    }
    
    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    const [newSchedules] = await connection.execute(`
      SELECT 
        travel_date,
        DATE(travel_date) as date_only,
        price,
        available_stock
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, ['23380210-a457-4dd7-aa92-6995ff3c2e2b']);
    
    console.log('修复后的价格日历:');
    newSchedules.forEach((schedule, index) => {
      const dateStr = schedule.date_only.toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${dateStr} - 价格:${schedule.price}, 库存:${schedule.available_stock}`);
    });
    
    // 4. 测试日期查询
    console.log('\n4️⃣ 测试日期查询...');
    const testDate = '2025-08-21';
    
    const [queryResult] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND DATE(travel_date) = DATE(?)
    `, ['23380210-a457-4dd7-aa92-6995ff3c2e2b', testDate]);
    
    console.log(`查询日期 ${testDate}: ${queryResult.length} 条记录`);
    
    if (queryResult.length > 0) {
      console.log('✅ 日期查询修复成功！');
    } else {
      console.log('❌ 日期查询仍然失败');
    }
    
    console.log('\n🎉 时区日期匹配问题修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixTimezoneDateMatching().catch(console.error);