const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugCustomerOrdersMissing() {
  console.log('🔍 调试客户订单显示问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查数据库中的订单数据
    console.log('\n1️⃣ 检查数据库中的订单数据...');
    
    const [orders] = await connection.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.product_title,
        o.travel_date,
        o.total_price,
        o.status,
        o.createdAt,
        u.username as customer_username,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.createdAt DESC
      LIMIT 10
    `);
    
    console.log(`📊 数据库中共有 ${orders.length} 个订单:`);
    orders.forEach(order => {
      console.log(`  - 订单号: ${order.order_number}`);
      console.log(`    客户ID: ${order.customer_id}`);
      console.log(`    客户姓名: ${order.customer_name}`);
      console.log(`    客户用户名: ${order.customer_username}`);
      console.log(`    客户邮箱: ${order.customer_email}`);
      console.log(`    创建时间: ${order.created_at}`);
      console.log('');
    });
    
    // 2. 检查testcustomer用户
    console.log('\n2️⃣ 检查testcustomer用户信息...');
    
    const [customers] = await connection.execute(`
      SELECT id, username, email, role, status, created_at
      FROM users 
      WHERE username = 'testcustomer' OR email LIKE '%testcustomer%'
    `);
    
    if (customers.length === 0) {
      console.log('❌ 未找到testcustomer用户');
      
      // 查找最近创建的客户
      const [recentCustomers] = await connection.execute(`
        SELECT id, username, email, role, status, created_at
        FROM users 
        WHERE role = 'customer'
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('📋 最近创建的客户用户:');
      recentCustomers.forEach(customer => {
        console.log(`  - ID: ${customer.id}`);
        console.log(`    用户名: ${customer.username}`);
        console.log(`    邮箱: ${customer.email}`);
        console.log(`    状态: ${customer.status}`);
        console.log('');
      });
    } else {
      console.log('✅ 找到testcustomer用户:');
      customers.forEach(customer => {
        console.log(`  - ID: ${customer.id}`);
        console.log(`    用户名: ${customer.username}`);
        console.log(`    邮箱: ${customer.email}`);
        console.log(`    角色: ${customer.role}`);
        console.log(`    状态: ${customer.status}`);
        console.log('');
        
        // 查找该用户的订单
        console.log(`🔍 查找用户 ${customer.username} 的订单...`);
        connection.execute(`
          SELECT id, order_number, customer_name, product_title, total_price, status, created_at
          FROM orders 
          WHERE customer_id = ?
          ORDER BY created_at DESC
        `, [customer.id]).then(([userOrders]) => {
          console.log(`📊 用户 ${customer.username} 有 ${userOrders.length} 个订单:`);
          userOrders.forEach(order => {
            console.log(`  - 订单号: ${order.order_number}`);
            console.log(`    客户姓名: ${order.customer_name}`);
            console.log(`    产品: ${order.product_title}`);
            console.log(`    金额: ¥${order.total_price}`);
            console.log(`    状态: ${order.status}`);
            console.log(`    创建时间: ${order.created_at}`);
            console.log('');
          });
        });
      });
    }
    
    // 3. 测试客户订单API
    console.log('\n3️⃣ 测试客户订单API...');
    
    // 首先尝试登录testcustomer
    try {
      console.log('🔐 尝试登录testcustomer...');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'testcustomer@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ testcustomer登录成功');
        const token = loginResponse.data.token;
        
        // 测试获取客户订单
        console.log('📋 获取客户订单...');
        const ordersResponse = await axios.get(`${BASE_URL}/api/customer/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📥 客户订单API响应:');
        console.log(JSON.stringify(ordersResponse.data, null, 2));
        
      } else {
        console.log('❌ testcustomer登录失败:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 登录或获取订单失败:', error.response?.data || error.message);
      
      // 如果登录失败，检查是否有其他客户用户可以测试
      if (customers.length > 0) {
        const testCustomer = customers[0];
        console.log(`\n🔄 尝试使用客户ID ${testCustomer.id} 直接查询订单...`);
        
        try {
          // 直接调用订单API（如果存在）
          const directOrdersResponse = await axios.get(`${BASE_URL}/api/orders?customer_id=${testCustomer.id}`);
          console.log('📥 直接订单查询响应:');
          console.log(JSON.stringify(directOrdersResponse.data, null, 2));
        } catch (directError) {
          console.log('❌ 直接订单查询失败:', directError.response?.data || directError.message);
        }
      }
    }
    
    // 4. 检查后端路由配置
    console.log('\n4️⃣ 检查后端路由配置...');
    
    try {
      const routesResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ 后端服务正常运行');
    } catch (error) {
      console.log('❌ 后端服务异常:', error.message);
    }
    
    // 检查是否有客户订单路由
    try {
      const customerRoutesResponse = await axios.get(`${BASE_URL}/api/customer/orders`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        validateStatus: function (status) {
          return status < 500; // 不要抛出4xx错误
        }
      });
      
      if (customerRoutesResponse.status === 401) {
        console.log('✅ 客户订单路由存在（需要认证）');
      } else if (customerRoutesResponse.status === 404) {
        console.log('❌ 客户订单路由不存在');
      } else {
        console.log(`ℹ️ 客户订单路由响应状态: ${customerRoutesResponse.status}`);
      }
    } catch (error) {
      console.log('❌ 检查客户订单路由失败:', error.message);
    }
    
    // 5. 生成修复建议
    console.log('\n5️⃣ 修复建议:');
    
    if (orders.length === 0) {
      console.log('❌ 数据库中没有订单数据');
      console.log('建议: 检查订单创建流程是否正常工作');
    } else {
      console.log('✅ 数据库中有订单数据');
      
      if (customers.length === 0) {
        console.log('❌ 未找到testcustomer用户');
        console.log('建议: 创建testcustomer用户或使用现有客户用户测试');
      } else {
        console.log('✅ 找到客户用户');
        console.log('建议: 检查客户订单API路由和权限配置');
      }
    }
    
    console.log('\n📋 检查清单:');
    console.log('1. 确认订单数据存在于数据库中');
    console.log('2. 确认客户用户存在且可以登录');
    console.log('3. 确认客户订单API路由正确配置');
    console.log('4. 确认前端调用正确的API端点');
    console.log('5. 确认订单查询使用正确的customer_id');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试脚本
debugCustomerOrdersMissing().catch(console.error);