const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugCustomerOrdersDisplay() {
  console.log('🔍 调试客户订单显示问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查数据库中的订单记录
    console.log('\n1️⃣ 检查数据库中的订单记录...');
    const [orders] = await connection.execute(`
      SELECT 
        id, order_number, product_id, customer_id, customer_name, 
        customer_email, status, travel_date, total_price, createdAt
      FROM orders 
      ORDER BY createdAt DESC 
      LIMIT 10
    `);
    
    console.log(`找到 ${orders.length} 个订单记录:`);
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
      console.log(`     客户ID: ${order.customer_id || '未设置'}`);
      console.log(`     客户姓名: ${order.customer_name}`);
      console.log(`     客户邮箱: ${order.customer_email}`);
      console.log(`     状态: ${order.status}`);
      console.log(`     创建时间: ${order.createdAt}`);
      console.log('');
    });
    
    // 2. 检查客户用户记录
    console.log('\n2️⃣ 检查客户用户记录...');
    const [customers] = await connection.execute(`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE role = 'customer'
      ORDER BY createdAt DESC
    `);
    
    console.log(`找到 ${customers.length} 个客户用户:`);
    customers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ID: ${customer.id}`);
      console.log(`     用户名: ${customer.username}`);
      console.log(`     邮箱: ${customer.email}`);
      console.log(`     状态: ${customer.status}`);
      console.log('');
    });
    
    // 3. 分析问题：订单的customer_id字段
    console.log('\n3️⃣ 分析订单customer_id字段问题...');
    const ordersWithoutCustomerId = orders.filter(order => !order.customer_id);
    
    if (ordersWithoutCustomerId.length > 0) {
      console.log(`⚠️ 发现 ${ordersWithoutCustomerId.length} 个订单没有customer_id:`);
      ordersWithoutCustomerId.forEach(order => {
        console.log(`  - 订单号: ${order.order_number}, 客户邮箱: ${order.customer_email}`);
      });
      
      // 4. 尝试修复：根据邮箱匹配customer_id
      console.log('\n4️⃣ 尝试修复customer_id字段...');
      
      for (const order of ordersWithoutCustomerId) {
        if (order.customer_email) {
          // 查找匹配的客户用户
          const [matchingCustomers] = await connection.execute(`
            SELECT id FROM users 
            WHERE email = ? AND role = 'customer'
          `, [order.customer_email]);
          
          if (matchingCustomers.length > 0) {
            const customerId = matchingCustomers[0].id;
            
            // 更新订单的customer_id
            await connection.execute(`
              UPDATE orders SET customer_id = ? WHERE id = ?
            `, [customerId, order.id]);
            
            console.log(`✅ 修复订单 ${order.order_number} 的customer_id: ${customerId}`);
          } else {
            console.log(`⚠️ 未找到邮箱 ${order.customer_email} 对应的客户用户`);
            
            // 创建对应的客户用户
            const { v4: uuidv4 } = require('uuid');
            const bcrypt = require('bcryptjs');
            
            const customerId = uuidv4();
            const password = 'customer123'; // 默认密码
            const hashedPassword = await bcrypt.hash(password, 10);
            
            try {
              await connection.execute(`
                INSERT INTO users (id, username, email, password, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                customerId, 
                order.customer_name || order.customer_email.split('@')[0],
                order.customer_email,
                hashedPassword,
                hashedPassword,
                'customer',
                'active'
              ]);
              
              // 更新订单的customer_id
              await connection.execute(`
                UPDATE orders SET customer_id = ? WHERE id = ?
              `, [customerId, order.id]);
              
              console.log(`✅ 创建客户用户并修复订单 ${order.order_number}`);
              console.log(`   客户ID: ${customerId}`);
              console.log(`   默认密码: ${password}`);
              
            } catch (createError) {
              console.log(`❌ 创建客户用户失败: ${createError.message}`);
            }
          }
        }
      }
    } else {
      console.log('✅ 所有订单都有customer_id字段');
    }
    
    // 5. 测试客户登录和订单API
    console.log('\n5️⃣ 测试客户登录和订单API...');
    
    if (customers.length > 0) {
      const testCustomer = customers[0];
      console.log(`使用客户进行测试: ${testCustomer.email}`);
      
      try {
        // 尝试登录
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: testCustomer.email,
          password: 'customer123' // 使用默认密码
        });
        
        if (loginResponse.data.success) {
          console.log('✅ 客户登录成功');
          const token = loginResponse.data.data.token;
          
          // 获取客户订单
          const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (ordersResponse.data.success) {
            const customerOrders = ordersResponse.data.data.orders;
            console.log(`✅ 获取客户订单成功: ${customerOrders.length} 个订单`);
            
            customerOrders.forEach((order, index) => {
              console.log(`  ${index + 1}. 订单号: ${order.order_number}`);
              console.log(`     旅行日期: ${order.travel_date}`);
              console.log(`     总价: ${order.total_price}`);
              console.log(`     状态: ${order.status}`);
            });
          } else {
            console.log('❌ 获取客户订单失败:', ordersResponse.data.message);
          }
          
        } else {
          console.log('❌ 客户登录失败:', loginResponse.data.message);
        }
        
      } catch (apiError) {
        console.log('❌ API测试失败:', apiError.response?.data?.message || apiError.message);
      }
    }
    
    // 6. 检查订单API的过滤逻辑
    console.log('\n6️⃣ 检查订单API的过滤逻辑...');
    console.log('检查后端代码中的订单过滤逻辑...');
    
    // 验证修复后的订单记录
    const [updatedOrders] = await connection.execute(`
      SELECT 
        id, order_number, customer_id, customer_name, customer_email, status
      FROM orders 
      WHERE customer_id IS NOT NULL
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    
    console.log(`修复后有customer_id的订单: ${updatedOrders.length} 个`);
    updatedOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. 订单号: ${order.order_number}, 客户ID: ${order.customer_id}`);
    });
    
    console.log('\n🎯 问题分析总结:');
    console.log('1. 订单创建时没有设置customer_id字段');
    console.log('2. 客户订单API根据customer_id过滤，导致订单不显示');
    console.log('3. 需要修复订单创建API，确保设置正确的customer_id');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试
debugCustomerOrdersDisplay().catch(console.error);