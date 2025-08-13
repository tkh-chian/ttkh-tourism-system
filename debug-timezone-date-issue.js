const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugTimezoneDateIssue() {
  console.log('🕐 调试时区相关的日期匹配问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查数据库时区设置
    console.log('\n1️⃣ 检查数据库时区设置...');
    const [timezoneRows] = await connection.execute('SELECT @@global.time_zone, @@session.time_zone');
    console.log('数据库时区:', timezoneRows[0]);
    
    // 2. 检查当前系统时间
    console.log('\n2️⃣ 检查系统时间...');
    console.log('Node.js系统时间:', new Date().toString());
    console.log('Node.js UTC时间:', new Date().toISOString());
    console.log('Node.js本地日期:', new Date().toLocaleDateString());
    
    // 3. 检查数据库中的实际日期数据
    console.log('\n3️⃣ 检查数据库中的日期数据...');
    const [schedules] = await connection.execute(`
      SELECT 
        product_id,
        travel_date,
        DATE(travel_date) as date_only,
        TIME(travel_date) as time_only,
        UNIX_TIMESTAMP(travel_date) as timestamp,
        price,
        available_stock
      FROM price_schedules 
      WHERE product_id = '23380210-a457-4dd7-aa92-6995ff3c2e2b'
      ORDER BY travel_date
      LIMIT 5
    `);
    
    console.log('数据库中的日期记录:');
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. travel_date: ${schedule.travel_date}`);
      console.log(`     date_only: ${schedule.date_only}`);
      console.log(`     time_only: ${schedule.time_only}`);
      console.log(`     timestamp: ${schedule.timestamp}`);
      console.log(`     price: ${schedule.price}, stock: ${schedule.available_stock}`);
      console.log('');
    });
    
    if (schedules.length === 0) {
      console.log('❌ 没有找到该产品的价格日历记录');
      return;
    }
    
    // 4. 测试不同的日期格式匹配
    console.log('\n4️⃣ 测试不同日期格式的匹配...');
    const testSchedule = schedules[0];
    const dbDate = testSchedule.travel_date;
    
    // 生成各种可能的日期格式
    const testDates = [
      dbDate.toISOString().split('T')[0], // 2025-08-22
      new Date(dbDate.getTime() - 24*60*60*1000).toISOString().split('T')[0], // 前一天
      new Date(dbDate.getTime() + 24*60*60*1000).toISOString().split('T')[0], // 后一天
      dbDate.toLocaleDateString('en-CA'), // YYYY-MM-DD格式
      dbDate.toDateString(), // 完整日期字符串
    ];
    
    console.log('测试日期格式:');
    for (const testDate of testDates) {
      console.log(`\n测试日期: ${testDate}`);
      
      // 测试原始查询
      const [result1] = await connection.execute(
        'SELECT COUNT(*) as count FROM price_schedules WHERE product_id = ? AND travel_date = ?',
        ['23380210-a457-4dd7-aa92-6995ff3c2e2b', testDate]
      );
      console.log(`  原始查询 (travel_date = ?): ${result1[0].count} 条记录`);
      
      // 测试DATE函数查询
      const [result2] = await connection.execute(
        'SELECT COUNT(*) as count FROM price_schedules WHERE product_id = ? AND DATE(travel_date) = DATE(?)',
        ['23380210-a457-4dd7-aa92-6995ff3c2e2b', testDate]
      );
      console.log(`  DATE函数查询 (DATE(travel_date) = DATE(?)): ${result2[0].count} 条记录`);
      
      // 测试字符串格式查询
      const [result3] = await connection.execute(
        'SELECT COUNT(*) as count FROM price_schedules WHERE product_id = ? AND DATE_FORMAT(travel_date, "%Y-%m-%d") = ?',
        ['23380210-a457-4dd7-aa92-6995ff3c2e2b', testDate]
      );
      console.log(`  格式化查询 (DATE_FORMAT = ?): ${result3[0].count} 条记录`);
    }
    
    // 5. 模拟前端发送的实际请求
    console.log('\n5️⃣ 模拟前端实际请求...');
    
    // 使用数据库中第一条记录的日期
    const frontendDate = testSchedule.travel_date.toISOString().split('T')[0];
    console.log(`前端发送日期: ${frontendDate}`);
    
    const orderData = {
      product_id: '23380210-a457-4dd7-aa92-6995ff3c2e2b',
      travel_date: frontendDate,
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '时区测试客户',
      customer_phone: '1234567890',
      customer_email: 'timezone@test.com',
      notes: '时区调试测试订单'
    };
    
    console.log('\n📤 发送订单请求...');
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      if (response.data.success) {
        console.log('🎉 订单创建成功！');
        console.log(`   订单号: ${response.data.data.order_number}`);
      } else {
        console.log('❌ 订单创建失败:', response.data.message);
      }
      
    } catch (error) {
      console.log('❌ 订单创建API错误:');
      console.log(`   状态码: ${error.response?.status}`);
      console.log(`   错误信息: ${error.response?.data?.message || error.message}`);
      
      // 6. 如果API失败，直接测试SQL查询
      console.log('\n6️⃣ 直接测试SQL查询...');
      
      const [directQuery] = await connection.execute(`
        SELECT * FROM price_schedules 
        WHERE product_id = ? AND DATE(travel_date) = DATE(?)
      `, ['23380210-a457-4dd7-aa92-6995ff3c2e2b', frontendDate]);
      
      console.log(`直接SQL查询结果: ${directQuery.length} 条记录`);
      if (directQuery.length > 0) {
        console.log('找到匹配记录:', {
          travel_date: directQuery[0].travel_date,
          price: directQuery[0].price,
          available_stock: directQuery[0].available_stock
        });
      }
    }
    
    // 7. 建议的修复方案
    console.log('\n7️⃣ 时区问题修复建议:');
    console.log('1. 使用 DATE() 函数进行日期比较（已实现）');
    console.log('2. 统一时区设置 - 数据库和Node.js都使用UTC');
    console.log('3. 前端发送日期时明确指定时区');
    console.log('4. 后端接收日期时进行时区转换');
    
    console.log('\n🔧 推荐的后端修复代码:');
    console.log(`
// 在订单创建API中，确保日期格式一致
const travel_date_normalized = new Date(travel_date).toISOString().split('T')[0];

// 使用更严格的日期查询
const [scheduleRows] = await pool.execute(
  'SELECT * FROM price_schedules WHERE product_id = ? AND DATE(travel_date) = ?',
  [product_id, travel_date_normalized]
);
    `);
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试
debugTimezoneDateIssue().catch(console.error);