const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugOrderCreation400() {
  console.log('🔍 调试订单创建HTTP 400错误...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查产品和价格日历数据
    console.log('\n1️⃣ 检查产品和价格日历数据...');
    
    const [products] = await connection.execute(`
      SELECT id, title_zh, status, merchant_id 
      FROM products 
      WHERE status = 'approved' 
      LIMIT 1
    `);
    
    if (products.length === 0) {
      console.log('❌ 没有找到已审核的产品');
      return;
    }
    
    const product = products[0];
    console.log(`✅ 找到产品: ${product.title_zh}`);
    console.log(`   产品ID: ${product.id}`);
    console.log(`   商家ID: ${product.merchant_id}`);
    
    // 检查价格日历
    const [schedules] = await connection.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? 
      ORDER BY travel_date 
      LIMIT 3
    `, [product.id]);
    
    console.log(`✅ 找到 ${schedules.length} 个价格日历记录`);
    if (schedules.length > 0) {
      const schedule = schedules[0];
      console.log(`   日期: ${schedule.travel_date}`);
      console.log(`   价格: ${schedule.price}`);
      console.log(`   总库存: ${schedule.total_stock}`);
      console.log(`   可用库存: ${schedule.available_stock}`);
      console.log(`   是否可用: ${schedule.is_available}`);
      
      // 2. 测试订单创建API - 详细调试
      console.log('\n2️⃣ 测试订单创建API...');
      
      const orderData = {
        product_id: product.id,
        travel_date: schedule.travel_date.toISOString().split('T')[0], // 确保日期格式正确
        adults: 2,
        children_no_bed: 1,
        children_with_bed: 0,
        infants: 0,
        customer_name: '调试测试客户',
        customer_phone: '1234567890',
        customer_email: 'debug@test.com',
        notes: '调试订单创建400错误'
      };
      
      console.log('📤 发送订单数据:');
      console.log(JSON.stringify(orderData, null, 2));
      
      try {
        const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
          headers: {
            'Content-Type': 'application/json'
          },
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
        
        if (error.response?.data) {
          console.log('   完整响应数据:');
          console.log(JSON.stringify(error.response.data, null, 2));
        }
        
        // 3. 检查后端日志中可能的错误
        console.log('\n3️⃣ 可能的错误原因分析:');
        
        // 检查日期格式
        const dateStr = schedule.travel_date.toISOString().split('T')[0];
        console.log(`   日期格式: ${dateStr}`);
        
        // 检查库存
        if (schedule.available_stock < (orderData.adults + orderData.children_no_bed + orderData.children_with_bed + orderData.infants)) {
          console.log('   ⚠️ 可能原因: 库存不足');
        }
        
        // 检查产品状态
        if (product.status !== 'approved') {
          console.log('   ⚠️ 可能原因: 产品未审核');
        }
        
        // 检查必填字段
        const requiredFields = ['product_id', 'travel_date', 'customer_name'];
        for (const field of requiredFields) {
          if (!orderData[field]) {
            console.log(`   ⚠️ 可能原因: 缺少必填字段 ${field}`);
          }
        }
        
        // 4. 直接测试数据库插入
        console.log('\n4️⃣ 测试直接数据库插入...');
        try {
          const { v4: uuidv4 } = require('uuid');
          const orderId = uuidv4();
          const order_number = 'DEBUG-' + Date.now();
          const total_people = orderData.adults + orderData.children_no_bed + orderData.children_with_bed + orderData.infants;
          const unit_price = schedule.price;
          const total_price = unit_price * (orderData.adults + orderData.children_no_bed + orderData.children_with_bed);
          
          await connection.execute(`
            INSERT INTO orders (
              id, order_number, product_id, merchant_id, product_title, travel_date,
              adults, children_no_bed, children_with_bed, infants, total_people,
              customer_name, customer_phone, customer_email, unit_price, total_price,
              notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            orderId, order_number, product.id, product.merchant_id, product.title_zh,
            dateStr, orderData.adults, orderData.children_no_bed, orderData.children_with_bed,
            orderData.infants, total_people, orderData.customer_name, orderData.customer_phone,
            orderData.customer_email, unit_price, total_price, orderData.notes, 'pending'
          ]);
          
          console.log('✅ 直接数据库插入成功！');
          console.log(`   订单ID: ${orderId}`);
          console.log(`   订单号: ${order_number}`);
          
          // 更新库存
          await connection.execute(`
            UPDATE price_schedules 
            SET available_stock = available_stock - ? 
            WHERE product_id = ? AND travel_date = ?
          `, [total_people, product.id, dateStr]);
          
          console.log('✅ 库存更新成功');
          
        } catch (dbError) {
          console.log('❌ 直接数据库插入失败:', dbError.message);
        }
      }
      
    } else {
      console.log('❌ 没有找到价格日历记录');
    }
    
    console.log('\n🎯 调试总结:');
    console.log('如果直接数据库插入成功，说明问题在后端API逻辑中');
    console.log('如果直接数据库插入失败，说明问题在数据库结构或约束中');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试
debugOrderCreation400().catch(console.error);