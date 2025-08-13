const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function finalOrderDebugAndFix() {
  console.log('🔧 最终订单创建调试和修复...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查产品ID是否正确
    console.log('\n1️⃣ 检查产品ID...');
    const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
    
    const [products] = await connection.execute(`
      SELECT id, title_zh, status, merchant_id 
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
    
    // 2. 检查价格日历
    console.log('\n2️⃣ 检查价格日历...');
    const [schedules] = await connection.execute(`
      SELECT 
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
      console.log(`  ${index + 1}. ${schedule.date_only.toISOString().split('T')[0]} - 价格:${schedule.price}, 库存:${schedule.available_stock}`);
    });
    
    if (schedules.length === 0) {
      console.log('❌ 没有价格日历记录！');
      return;
    }
    
    // 3. 使用第一个可用日期测试订单创建
    const testSchedule = schedules[0];
    const testDate = testSchedule.date_only.toISOString().split('T')[0];
    
    console.log(`\n3️⃣ 使用日期 ${testDate} 测试订单创建...`);
    
    const orderData = {
      product_id: productId,
      travel_date: testDate,
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '最终测试客户',
      customer_phone: '1234567890',
      customer_email: 'final@test.com',
      notes: '最终调试测试订单'
    };
    
    console.log('📤 发送订单数据:');
    console.log(JSON.stringify(orderData, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data.success) {
        console.log('🎉 订单创建成功！');
        console.log(`   订单号: ${response.data.data.order_number}`);
        console.log(`   订单ID: ${response.data.data.orderId}`);
      } else {
        console.log('❌ 订单创建失败:', response.data.message);
        if (response.data.availableDates) {
          console.log('   可用日期:', response.data.availableDates);
        }
      }
      
    } catch (error) {
      console.log('❌ 订单创建API错误:');
      console.log(`   状态码: ${error.response?.status}`);
      console.log(`   错误信息: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log('   完整响应:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      
      // 4. 如果API失败，检查后端日志和数据库状态
      console.log('\n4️⃣ 深度调试...');
      
      // 检查数据库查询
      console.log('测试数据库查询:');
      const [queryTest] = await connection.execute(`
        SELECT * FROM price_schedules 
        WHERE product_id = ? AND DATE(travel_date) = DATE(?)
      `, [productId, testDate]);
      
      console.log(`查询结果: ${queryTest.length} 条记录`);
      if (queryTest.length > 0) {
        console.log('查询到的记录:', {
          travel_date: queryTest[0].travel_date,
          price: queryTest[0].price,
          available_stock: queryTest[0].available_stock
        });
      }
      
      // 5. 尝试修复后端API中可能的问题
      console.log('\n5️⃣ 检查可能的修复方案...');
      
      // 检查产品状态
      if (product.status !== 'approved') {
        console.log('⚠️ 产品状态不是approved，可能导致订单创建失败');
        
        // 临时修改产品状态为approved
        await connection.execute(`
          UPDATE products SET status = 'approved' WHERE id = ?
        `, [productId]);
        console.log('✅ 临时将产品状态设置为approved');
        
        // 重新测试
        console.log('\n重新测试订单创建...');
        try {
          const retryResponse = await axios.post(`${BASE_URL}/api/orders`, orderData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          });
          
          if (retryResponse.data.success) {
            console.log('🎉 修复后订单创建成功！');
            console.log(`   订单号: ${retryResponse.data.data.order_number}`);
          } else {
            console.log('❌ 修复后仍然失败:', retryResponse.data.message);
          }
        } catch (retryError) {
          console.log('❌ 修复后仍然出错:', retryError.response?.data?.message || retryError.message);
        }
      }
      
      // 6. 检查orders表结构
      console.log('\n6️⃣ 检查orders表结构...');
      const [orderColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'orders'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('orders表字段:');
      orderColumns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE}) 默认值: ${col.COLUMN_DEFAULT || 'none'}`);
      });
      
      // 7. 直接测试SQL插入
      console.log('\n7️⃣ 直接测试SQL插入...');
      try {
        const { v4: uuidv4 } = require('uuid');
        const orderId = uuidv4();
        const order_number = 'FINAL-' + Date.now();
        const total_people = orderData.adults + orderData.children_no_bed + orderData.children_with_bed + orderData.infants;
        const unit_price = testSchedule.price;
        const total_price = unit_price * (orderData.adults + orderData.children_no_bed + orderData.children_with_bed);
        
        await connection.execute(`
          INSERT INTO orders (
            id, order_number, product_id, merchant_id, product_title, travel_date,
            adults, children_no_bed, children_with_bed, infants, total_people,
            customer_name, customer_phone, customer_email, unit_price, total_price,
            notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId, order_number, productId, product.merchant_id, product.title_zh,
          testDate, orderData.adults, orderData.children_no_bed, orderData.children_with_bed,
          orderData.infants, total_people, orderData.customer_name, orderData.customer_phone,
          orderData.customer_email, unit_price, total_price, orderData.notes, 'pending'
        ]);
        
        console.log('✅ 直接SQL插入成功！');
        console.log(`   订单ID: ${orderId}`);
        console.log(`   订单号: ${order_number}`);
        
        // 更新库存
        await connection.execute(`
          UPDATE price_schedules 
          SET available_stock = available_stock - ? 
          WHERE product_id = ? AND DATE(travel_date) = DATE(?)
        `, [total_people, productId, testDate]);
        
        console.log('✅ 库存更新成功');
        
        console.log('\n🎯 结论: 数据库操作正常，问题在API逻辑中');
        
      } catch (sqlError) {
        console.log('❌ 直接SQL插入失败:', sqlError.message);
        console.log('🎯 结论: 数据库结构有问题');
      }
    }
    
    console.log('\n🔧 修复建议:');
    console.log('1. 确保产品状态为approved');
    console.log('2. 确保价格日历存在且有库存');
    console.log('3. 检查后端API的错误处理逻辑');
    console.log('4. 检查数据库字段约束');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行最终调试
finalOrderDebugAndFix().catch(console.error);