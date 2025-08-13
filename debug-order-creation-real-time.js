const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugOrderCreationRealTime() {
  console.log('🔍 实时调试订单创建失败问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查当前价格日历状态
    console.log('\n1️⃣ 检查价格日历状态...');
    const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
    
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        travel_date,
        DATE(travel_date) as date_only,
        price,
        total_stock,
        available_stock,
        is_available
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, [productId]);
    
    console.log(`找到 ${schedules.length} 个价格日历记录:`);
    schedules.forEach((schedule, index) => {
      const dateStr = schedule.date_only.toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${dateStr} - 价格:${schedule.price}, 库存:${schedule.available_stock}`);
    });
    
    if (schedules.length === 0) {
      console.log('❌ 没有价格日历记录！');
      return;
    }
    
    // 2. 使用第一个可用日期测试
    const testDate = schedules[0].date_only.toISOString().split('T')[0];
    console.log(`\n2️⃣ 使用日期 ${testDate} 测试订单创建...`);
    
    const orderData = {
      product_id: productId,
      travel_date: testDate,
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '实时调试客户',
      customer_phone: '1234567890',
      customer_email: 'realtime@test.com',
      notes: '实时调试订单'
    };
    
    console.log('📤 发送订单数据:');
    console.log(JSON.stringify(orderData, null, 2));
    
    // 3. 发送请求并捕获详细错误
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
      
      if (response.status === 400) {
        console.log('\n❌ 400错误详细分析:');
        console.log(`错误信息: ${response.data.message}`);
        
        if (response.data.availableDates) {
          console.log(`可用日期: ${response.data.availableDates.join(', ')}`);
        }
        
        // 4. 检查后端日期查询逻辑
        console.log('\n4️⃣ 验证后端日期查询逻辑...');
        
        // 测试相同的查询
        const [queryResult] = await connection.execute(`
          SELECT * FROM price_schedules 
          WHERE product_id = ? AND DATE(travel_date) = DATE(?)
        `, [productId, testDate]);
        
        console.log(`数据库查询结果: ${queryResult.length} 条记录`);
        
        if (queryResult.length === 0) {
          console.log('⚠️ 数据库查询返回0条记录，这是问题所在！');
          
          // 尝试不同的查询方式
          console.log('\n5️⃣ 尝试不同的查询方式...');
          
          // 方式1: 直接比较字符串
          const [query1] = await connection.execute(`
            SELECT * FROM price_schedules 
            WHERE product_id = ? AND DATE_FORMAT(travel_date, '%Y-%m-%d') = ?
          `, [productId, testDate]);
          console.log(`DATE_FORMAT查询: ${query1.length} 条记录`);
          
          // 方式2: 范围查询
          const [query2] = await connection.execute(`
            SELECT * FROM price_schedules 
            WHERE product_id = ? AND travel_date >= ? AND travel_date < DATE_ADD(?, INTERVAL 1 DAY)
          `, [productId, testDate, testDate]);
          console.log(`范围查询: ${query2.length} 条记录`);
          
          // 如果范围查询有结果，说明是日期格式问题
          if (query2.length > 0) {
            console.log('✅ 找到解决方案：使用范围查询');
            
            // 6. 临时修复：更新后端API使用范围查询
            console.log('\n6️⃣ 需要修复后端API的日期查询逻辑');
            console.log('建议修改为范围查询：');
            console.log('WHERE product_id = ? AND travel_date >= ? AND travel_date < DATE_ADD(?, INTERVAL 1 DAY)');
          }
        } else {
          console.log('✅ 数据库查询正常，问题可能在其他地方');
        }
        
      } else if (response.status === 200) {
        console.log('🎉 订单创建成功！');
      }
      
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
      if (error.response) {
        console.log('响应状态:', error.response.status);
        console.log('响应数据:', error.response.data);
      }
    }
    
    // 7. 检查后端服务器日志建议
    console.log('\n7️⃣ 后端服务器日志检查建议:');
    console.log('请查看运行 simple-server-fixed.js 的终端窗口');
    console.log('查找是否有以下错误信息:');
    console.log('- 数据库连接错误');
    console.log('- SQL语法错误');
    console.log('- 字段约束错误');
    console.log('- 其他运行时错误');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行实时调试
debugOrderCreationRealTime().catch(console.error);