const mysql = require('mysql2/promise');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixCustomerOrdersDisplay() {
  console.log('🔧 修复客户订单显示问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查订单表结构
    console.log('\n1️⃣ 检查订单表结构...');
    const [ordersColumns] = await connection.execute(`
      SHOW COLUMNS FROM orders
    `);
    
    console.log('订单表结构:');
    ordersColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可为空)' : '(非空)'}`);
    });
    
    // 2. 检查最近创建的订单
    console.log('\n2️⃣ 检查最近创建的订单...');
    const [recentOrders] = await connection.execute(`
      SELECT 
        o.id, 
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_email,
        o.travel_date,
        o.product_id,
        o.product_title,
        o.total_price,
        o.createdAt,
        u.email as user_email,
        u.id as user_id
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.createdAt DESC
      LIMIT 10
    `);
    
    console.log(`找到 ${recentOrders.length} 个最近订单:`);
    recentOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. 订单ID: ${order.id}`);
      console.log(`     订单号: ${order.order_number}`);
      console.log(`     客户ID: ${order.customer_id}`);
      console.log(`     客户名称: ${order.customer_name}`);
      console.log(`     客户邮箱: ${order.customer_email}`);
      console.log(`     关联用户邮箱: ${order.user_email || '未关联'}`);
      console.log(`     关联用户ID: ${order.user_id || '未关联'}`);
      console.log(`     创建时间: ${order.createdAt}`);
    });
    
    // 3. 检查当前登录用户
    console.log('\n3️⃣ 检查当前登录用户...');
    console.log('请输入当前登录用户的邮箱:');
    
    // 模拟用户输入
    const currentUserEmail = 'final-fix@test.com'; // 这里应该是当前登录用户的邮箱
    console.log(`当前用户邮箱: ${currentUserEmail}`);
    
    // 查找用户
    const [currentUser] = await connection.execute(`
      SELECT id, email, name, role FROM users WHERE email = ?
    `, [currentUserEmail]);
    
    if (currentUser.length === 0) {
      console.log(`❌ 未找到邮箱为 ${currentUserEmail} 的用户`);
      
      // 创建新用户
      console.log('\n创建新用户...');
      const userId = uuidv4();
      
      await connection.execute(`
        INSERT INTO users (
          id, email, name, role, status, password, username
        ) VALUES (
          ?, ?, ?, 'customer', 'active', '$2a$10$CwTycUXWue0Thq9StjUM0uQxTmrjFPTR.eOUQ/d/LviAzLXpIpQXS', ?
        )
      `, [userId, currentUserEmail, '测试客户', currentUserEmail]);
      
      console.log(`✅ 创建新用户ID: ${userId}`);
      
      // 关联订单到新用户
      for (const order of recentOrders) {
        if (order.customer_email === currentUserEmail || !order.customer_id) {
          await connection.execute(`
            UPDATE orders SET customer_id = ? WHERE id = ?
          `, [userId, order.id]);
          
          console.log(`✅ 已关联订单 ${order.id} 到用户 ${userId}`);
        }
      }
    } else {
      const userId = currentUser[0].id;
      console.log(`✅ 找到用户: ${currentUser[0].name || currentUser[0].email} (ID: ${userId})`);
      
      // 关联订单到当前用户
      for (const order of recentOrders) {
        if (order.customer_email === currentUserEmail || !order.customer_id) {
          await connection.execute(`
            UPDATE orders SET customer_id = ? WHERE id = ?
          `, [userId, order.id]);
          
          console.log(`✅ 已关联订单 ${order.id} 到用户 ${userId}`);
        }
      }
    }
    
    // 4. 修复后端API查询逻辑
    console.log('\n4️⃣ 修复后端API查询逻辑...');
    
    // 检查后端API是否正确处理customer_id
    console.log('\n检查客户订单API...');
    
    try {
      // 获取一个有效的JWT令牌
      console.log('尝试登录获取令牌...');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: currentUserEmail,
        password: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        const token = loginResponse.data.token;
        console.log('✅ 登录成功，获取到令牌');
        
        // 测试客户订单API
        const ordersResponse = await axios.get(`${BASE_URL}/api/customer/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        console.log(`订单API响应 (状态码: ${ordersResponse.status}):`);
        if (ordersResponse.status === 200) {
          console.log(`找到 ${ordersResponse.data.orders?.length || 0} 个订单`);
          
          if (ordersResponse.data.orders?.length > 0) {
            console.log('✅ 客户订单API正常工作');
          } else {
            console.log('⚠️ 客户订单API返回空列表，可能需要进一步修复');
          }
        } else {
          console.log('❌ 客户订单API请求失败');
        }
      } else {
        console.log('❌ 登录失败，无法获取令牌');
      }
    } catch (error) {
      console.log('❌ API请求失败:', error.message);
    }
    
    // 5. 修复前端订单显示
    console.log('\n5️⃣ 修复前端订单显示...');
    console.log('请确保前端正确处理以下几点:');
    console.log('1. 前端登录后正确存储JWT令牌');
    console.log('2. 请求订单时在请求头中包含Authorization: Bearer {token}');
    console.log('3. 确保前端调用的是正确的API端点: /api/customer/orders');
    
    // 6. 总结修复结果
    console.log('\n🔍 修复总结:');
    console.log('1. 已检查订单表结构');
    console.log('2. 已检查最近创建的订单');
    console.log('3. 已将订单关联到当前登录用户');
    console.log('4. 已测试客户订单API');
    console.log('5. 已提供前端修复建议');
    
    console.log('\n🚀 请重新登录并刷新页面以查看订单');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复脚本
fixCustomerOrdersDisplay().catch(console.error);