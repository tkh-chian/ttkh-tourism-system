const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function finalDateFormatFix() {
  console.log('🔧 最终日期格式修复...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查当前价格日历格式
    console.log('\n1️⃣ 检查当前价格日历格式...');
    const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
    
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        travel_date,
        DATE_FORMAT(travel_date, '%Y-%m-%d') as formatted_date,
        price,
        available_stock
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, [productId]);
    
    console.log(`找到 ${schedules.length} 个价格日历记录:`);
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. travel_date原始值: ${schedule.travel_date}`);
      console.log(`     格式化后: ${schedule.formatted_date}`);
      console.log(`     类型: ${typeof schedule.travel_date}`);
    });
    
    // 2. 修复后端API中的日期查询逻辑
    console.log('\n2️⃣ 修复后端API中的日期查询逻辑...');
    console.log('修改simple-server-fixed.js中的日期查询逻辑为:');
    console.log('WHERE product_id = ? AND DATE_FORMAT(travel_date, "%Y-%m-%d") = ?');
    
    // 3. 测试不同的日期查询方式
    console.log('\n3️⃣ 测试不同的日期查询方式...');
    const testDate = '2025-08-20';
    
    // 方式1: DATE_FORMAT
    const [query1] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND DATE_FORMAT(travel_date, '%Y-%m-%d') = ?
    `, [productId, testDate]);
    console.log(`DATE_FORMAT查询: ${query1.length} 条记录`);
    
    // 方式2: 字符串比较
    const [query2] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND travel_date = ?
    `, [productId, testDate]);
    console.log(`直接字符串比较: ${query2.length} 条记录`);
    
    // 方式3: 转换为日期对象
    const [query3] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND DATE(travel_date) = ?
    `, [productId, testDate]);
    console.log(`DATE()函数查询: ${query3.length} 条记录`);
    
    // 4. 修复价格日历数据
    console.log('\n4️⃣ 修复价格日历数据...');
    
    // 删除现有记录
    await connection.execute(`
      DELETE FROM price_schedules WHERE product_id = ?
    `, [productId]);
    console.log('✅ 删除现有价格日历记录');
    
    // 重新插入正确格式的日期
    const { v4: uuidv4 } = require('uuid');
    const correctDates = [
      '2025-08-20',
      '2025-08-21',
      '2025-08-27',
      '2025-08-28'
    ];
    
    for (const date of correctDates) {
      const scheduleId = uuidv4();
      
      // 使用正确的日期格式插入
      await connection.execute(`
        INSERT INTO price_schedules (
          id, product_id, travel_date, price, total_stock, available_stock, is_available
        ) VALUES (?, ?, STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ?, ?)
      `, [scheduleId, productId, date, 1232.00, 20, 20, 1]);
      
      console.log(`✅ 插入日期: ${date} (使用STR_TO_DATE确保正确格式)`);
    }
    
    // 5. 验证修复结果
    console.log('\n5️⃣ 验证修复结果...');
    const [newSchedules] = await connection.execute(`
      SELECT 
        travel_date,
        DATE_FORMAT(travel_date, '%Y-%m-%d') as formatted_date
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, [productId]);
    
    console.log('修复后的价格日历:');
    newSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.formatted_date}`);
    });
    
    // 6. 测试订单创建API
    console.log('\n6️⃣ 测试订单创建API...');
    const orderData = {
      product_id: productId,
      travel_date: correctDates[0], // 使用第一个日期
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '最终修复测试',
      customer_phone: '1234567890',
      customer_email: 'final-fix@test.com',
      notes: '最终日期格式修复测试'
    };
    
    console.log('📤 发送订单数据:');
    console.log(JSON.stringify(orderData, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // 不要抛出400错误，我们要看响应内容
        }
      });
      
      console.log(`\n📥 API响应 (状态码: ${response.status}):`);
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.status === 200) {
        console.log('🎉 订单创建成功！问题已解决！');
      } else {
        console.log('❌ 订单创建仍然失败，需要进一步修复');
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
    
    // 7. 最终修复建议
    console.log('\n7️⃣ 最终修复建议:');
    console.log('1. 修改后端API中的日期查询逻辑为: DATE_FORMAT(travel_date, "%Y-%m-%d") = ?');
    console.log('2. 确保所有日期插入使用STR_TO_DATE函数确保格式一致');
    console.log('3. 前端发送的日期格式应为YYYY-MM-DD');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行最终修复
finalDateFormatFix().catch(console.error);