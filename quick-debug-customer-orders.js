const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function quickDebugCustomerOrders() {
  console.log('🔍 快速调试客户订单显示问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查orders表结构
    console.log('\n1️⃣ 检查orders表结构...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM orders`);
    console.log('orders表字段:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Default}`);
    });
    
    // 2. 检查最近的订单
    console.log('\n2️⃣ 检查最近的订单...');
    const [orders] = await connection.execute(`
      SELECT * FROM orders ORDER BY id DESC LIMIT 5
    `);
    
    console.log(`📊 找到 ${orders.length} 个订单:`);
    orders.forEach(order => {
      console.log(`  订单号: ${order.order_number}`);
      console.log(`  客户ID: ${order.customer_id}`);
      console.log(`  客户姓名: ${order.customer_name}`);
      console.log(`  产品: ${order.product_title}`);
      console.log(`  状态: ${order.status}`);
      console.log('');
    });
    
    // 3. 检查testcustomer用户
    console.log('\n3️⃣ 检查testcustomer用户...');
    const [users] = await connection.execute(`
      SELECT * FROM users WHERE username = 'testcustomer' OR email LIKE '%testcustomer%'
    `);
    
    if (users.length === 0) {
      console.log('❌ 未找到testcustomer用户');
      
      // 查找最近的客户用户
      const [customers] = await connection.execute(`
        SELECT * FROM users WHERE role = 'customer' ORDER BY id DESC LIMIT 3
      `);
      
      console.log('📋 最近的客户用户:');
      customers.forEach(customer => {
        console.log(`  ID: ${customer.id}`);
        console.log(`  用户名: ${customer.username}`);
        console.log(`  邮箱: ${customer.email}`);
        console.log('');
      });
      
      if (customers.length > 0) {
        const testCustomer = customers[0];
        console.log(`\n🔍 检查客户 ${testCustomer.username} 的订单...`);
        
        const [customerOrders] = await connection.execute(`
          SELECT * FROM orders WHERE customer_id = ?
        `, [testCustomer.id]);
        
        console.log(`📊 客户 ${testCustomer.username} 有 ${customerOrders.length} 个订单`);
      }
    } else {
      const testCustomer = users[0];
      console.log('✅ 找到testcustomer用户:');
      console.log(`  ID: ${testCustomer.id}`);
      console.log(`  用户名: ${testCustomer.username}`);
      console.log(`  邮箱: ${testCustomer.email}`);
      
      // 检查该用户的订单
      const [customerOrders] = await connection.execute(`
        SELECT * FROM orders WHERE customer_id = ?
      `, [testCustomer.id]);
      
      console.log(`\n📊 testcustomer 有 ${customerOrders.length} 个订单`);
      customerOrders.forEach(order => {
        console.log(`  订单号: ${order.order_number}`);
        console.log(`  产品: ${order.product_title}`);
        console.log(`  状态: ${order.status}`);
        console.log('');
      });
    }
    
    // 4. 测试客户订单API
    console.log('\n4️⃣ 测试客户订单API...');
    
    try {
      // 测试不带认证的客户订单API
      const response = await axios.get(`${BASE_URL}/api/customer/orders`, {
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      console.log(`API响应状态: ${response.status}`);
      if (response.status === 404) {
        console.log('❌ 客户订单API路由不存在');
      } else if (response.status === 401) {
        console.log('✅ 客户订单API存在但需要认证');
      } else {
        console.log('API响应:', response.data);
      }
    } catch (error) {
      console.log('❌ API测试失败:', error.message);
    }
    
    // 5. 检查后端路由文件
    console.log('\n5️⃣ 检查后端路由配置...');
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // 检查主服务器文件
      const serverPath = path.join(__dirname, 'backend', 'simple-server-fixed.js');
      const serverCode = await fs.readFile(serverPath, 'utf8');
      
      if (serverCode.includes('/api/customer/orders')) {
        console.log('✅ 找到客户订单路由配置');
      } else {
        console.log('❌ 未找到客户订单路由配置');
        console.log('需要添加客户订单API路由');
      }
      
      // 检查是否有订单路由文件
      const ordersRoutePath = path.join(__dirname, 'backend', 'routes', 'orders.js');
      try {
        const ordersRouteCode = await fs.readFile(ordersRoutePath, 'utf8');
        if (ordersRouteCode.includes('customer/orders')) {
          console.log('✅ 订单路由文件包含客户订单路由');
        } else {
          console.log('⚠️ 订单路由文件不包含客户订单路由');
        }
      } catch (error) {
        console.log('⚠️ 订单路由文件不存在');
      }
      
    } catch (error) {
      console.log('❌ 检查路由配置失败:', error.message);
    }
    
    // 6. 生成修复建议
    console.log('\n6️⃣ 修复建议:');
    
    if (orders.length === 0) {
      console.log('❌ 数据库中没有订单 - 订单创建可能有问题');
    } else {
      console.log('✅ 数据库中有订单数据');
      
      if (users.length === 0) {
        console.log('❌ 没有testcustomer用户 - 需要创建或使用其他客户用户');
      } else {
        console.log('✅ 有客户用户');
        console.log('问题可能在于:');
        console.log('1. 客户订单API路由缺失或配置错误');
        console.log('2. 前端调用错误的API端点');
        console.log('3. 认证token问题');
        console.log('4. 订单查询条件不匹配');
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试
quickDebugCustomerOrders().catch(console.error);