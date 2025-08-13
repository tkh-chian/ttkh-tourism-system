const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function systematicOrderDebug() {
  console.log('🔍 系统性订单创建调试...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查后端服务器状态
    console.log('\n1️⃣ 检查后端服务器状态...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ 后端服务器正常运行');
      console.log(`   版本: ${healthResponse.data.version}`);
    } catch (error) {
      console.log('❌ 后端服务器无法访问:', error.message);
      return;
    }
    
    // 2. 检查产品数据
    console.log('\n2️⃣ 检查产品数据...');
    const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
    
    const [products] = await connection.execute(`
      SELECT id, title_zh, status, merchant_id, base_price
      FROM products 
      WHERE id = ?
    `, [productId]);
    
    if (products.length === 0) {
      console.log('❌ 产品不存在！');
      return;
    }
    
    const product = products[0];
    console.log(`✅ 产品存在: ${product.title_zh}`);
    console.log(`   状态: ${product.status}`);
    console.log(`   商家ID: ${product.merchant_id}`);
    console.log(`   基础价格: ${product.base_price}`);
    
    // 3. 检查价格日历数据
    console.log('\n3️⃣ 检查价格日历数据...');
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        travel_date,
        DATE(travel_date) as date_only,
        price,
        total_stock,
        available_stock,
        is_available,
        createdAt,
        updatedAt
      FROM price_schedules 
      WHERE product_id = ?
      ORDER BY travel_date
    `, [productId]);
    
    console.log(`找到 ${schedules.length} 个价格日历记录:`);
    schedules.forEach((schedule, index) => {
      const dateStr = schedule.date_only.toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${dateStr} - 价格:${schedule.price}, 总库存:${schedule.total_stock}, 可用库存:${schedule.available_stock}`);
    });
    
    if (schedules.length === 0) {
      console.log('❌ 没有价格日历记录！需要先创建价格日历');
      return;
    }
    
    // 4. 测试不同的日期查询方式
    console.log('\n4️⃣ 测试日期查询方式...');
    const testDate = '2025-08-21';
    
    // 方式1: DATE(travel_date) = ?
    const [query1] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND DATE(travel_date) = ?
    `, [productId, testDate]);
    console.log(`查询方式1 (DATE(travel_date) = ?): ${query1.length} 条记录`);
    
    // 方式2: DATE(travel_date) = DATE(?)
    const [query2] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND DATE(travel_date) = DATE(?)
    `, [productId, testDate]);
    console.log(`查询方式2 (DATE(travel_date) = DATE(?)): ${query2.length} 条记录`);
    
    // 方式3: travel_date LIKE ?
    const [query3] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? AND travel_date LIKE ?
    `, [productId, testDate + '%']);
    console.log(`查询方式3 (travel_date LIKE ?): ${query3.length} 条记录`);
    
    // 5. 检查实际的travel_date格式
    console.log('\n5️⃣ 检查travel_date字段格式...');
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      console.log(`第一条记录的travel_date: ${firstSchedule.travel_date}`);
      console.log(`类型: ${typeof firstSchedule.travel_date}`);
      console.log(`toString(): ${firstSchedule.travel_date.toString()}`);
      console.log(`toISOString(): ${firstSchedule.travel_date.toISOString()}`);
    }
    
    // 6. 使用正确的查询方式测试订单创建API
    console.log('\n6️⃣ 测试订单创建API...');
    
    // 找到一个有库存的日期
    const availableSchedule = schedules.find(s => s.available_stock > 0);
    if (!availableSchedule) {
      console.log('❌ 没有可用库存的日期');
      return;
    }
    
    const availableDate = availableSchedule.date_only.toISOString().split('T')[0];
    console.log(`使用可用日期: ${availableDate}`);
    
    const orderData = {
      product_id: productId,
      travel_date: availableDate,
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '系统调试客户',
      customer_phone: '1234567890',
      customer_email: 'debug@test.com',
      notes: '系统调试订单'
    };
    
    console.log('📤 发送订单数据:');
    console.log(JSON.stringify(orderData, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('🎉 订单创建成功！');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ 订单创建失败:');
      console.log(`   状态码: ${error.response?.status}`);
      console.log(`   错误信息: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log('   完整响应:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      
      // 7. 如果API失败，检查后端代码中的具体问题
      console.log('\n7️⃣ 分析可能的问题...');
      
      // 检查orders表结构
      const [orderColumns] = await connection.execute(`
        DESCRIBE orders
      `);
      
      console.log('orders表结构:');
      orderColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || 'NULL'}`);
      });
      
      // 检查是否有必需字段缺失默认值
      const requiredFields = orderColumns.filter(col => col.Null === 'NO' && col.Default === null && col.Extra !== 'auto_increment');
      if (requiredFields.length > 0) {
        console.log('\n⚠️ 发现必需字段缺失默认值:');
        requiredFields.forEach(field => {
          console.log(`  - ${field.Field}: ${field.Type}`);
        });
      }
      
      // 8. 尝试手动执行订单插入SQL
      console.log('\n8️⃣ 尝试手动执行订单插入...');
      try {
        const { v4: uuidv4 } = require('uuid');
        const orderId = uuidv4();
        const order_number = 'DEBUG-' + Date.now();
        const total_people = orderData.adults + orderData.children_no_bed + orderData.children_with_bed + orderData.infants;
        const unit_price = availableSchedule.price;
        const total_price = unit_price * (orderData.adults + orderData.children_no_bed + orderData.children_with_bed);
        
        const insertSQL = `
          INSERT INTO orders (
            id, order_number, product_id, merchant_id, product_title, travel_date,
            adults, children_no_bed, children_with_bed, infants, total_people,
            customer_name, customer_phone, customer_email, unit_price, total_price,
            notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(insertSQL, [
          orderId, order_number, productId, product.merchant_id, product.title_zh,
          availableDate, orderData.adults, orderData.children_no_bed, orderData.children_with_bed,
          orderData.infants, total_people, orderData.customer_name, orderData.customer_phone,
          orderData.customer_email, unit_price, total_price, orderData.notes, 'pending'
        ]);
        
        console.log('✅ 手动SQL插入成功！');
        console.log(`   订单ID: ${orderId}`);
        console.log(`   订单号: ${order_number}`);
        
        console.log('\n🎯 结论: 数据库操作正常，问题在API代码逻辑中');
        
      } catch (sqlError) {
        console.log('❌ 手动SQL插入失败:', sqlError.message);
        console.log('🎯 结论: 数据库结构或约束有问题');
      }
    }
    
    // 9. 检查后端日志
    console.log('\n9️⃣ 建议检查后端控制台日志...');
    console.log('请查看运行 simple-server-fixed.js 的终端窗口中的错误信息');
    
  } catch (error) {
    console.error('❌ 系统调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行系统调试
systematicOrderDebug().catch(console.error);