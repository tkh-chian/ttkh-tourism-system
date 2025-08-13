const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugMerchantOrdersMissing() {
  console.log('🔍 调试商家订单显示问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查数据库中的订单和商家关联
    console.log('\n1️⃣ 检查订单和商家关联...');
    
    const [orders] = await connection.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.merchant_id,
        o.customer_id,
        o.customer_name,
        o.product_title,
        o.total_price,
        o.status,
        m.username as merchant_username,
        m.email as merchant_email,
        c.username as customer_username
      FROM orders o
      LEFT JOIN users m ON o.merchant_id = m.id AND m.role = 'merchant'
      LEFT JOIN users c ON o.customer_id = c.id
      ORDER BY o.createdAt DESC
      LIMIT 10
    `);
    
    console.log(`📊 数据库中共有 ${orders.length} 个订单:`);
    orders.forEach(order => {
      console.log(`  订单号: ${order.order_number}`);
      console.log(`  商家ID: ${order.merchant_id}`);
      console.log(`  商家用户名: ${order.merchant_username}`);
      console.log(`  客户姓名: ${order.customer_name}`);
      console.log(`  产品: ${order.product_title}`);
      console.log(`  状态: ${order.status}`);
      console.log('');
    });
    
    // 2. 检查商家用户
    console.log('\n2️⃣ 检查商家用户...');
    
    const [merchants] = await connection.execute(`
      SELECT id, username, email, role, status
      FROM users 
      WHERE role = 'merchant'
      ORDER BY createdAt DESC
    `);
    
    console.log(`📋 找到 ${merchants.length} 个商家用户:`);
    merchants.forEach(merchant => {
      console.log(`  ID: ${merchant.id}`);
      console.log(`  用户名: ${merchant.username}`);
      console.log(`  邮箱: ${merchant.email}`);
      console.log(`  状态: ${merchant.status}`);
      console.log('');
    });
    
    // 3. 检查订单是否正确关联到商家
    if (merchants.length > 0) {
      const testMerchant = merchants[0];
      console.log(`\n🔍 检查商家 ${testMerchant.username} 的订单...`);
      
      const [merchantOrders] = await connection.execute(`
        SELECT 
          o.id,
          o.order_number,
          o.customer_name,
          o.product_title,
          o.total_price,
          o.status,
          p.title_zh as product_name
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.merchant_id = ?
        ORDER BY o.createdAt DESC
      `, [testMerchant.id]);
      
      console.log(`📊 商家 ${testMerchant.username} 有 ${merchantOrders.length} 个订单`);
      
      if (merchantOrders.length === 0) {
        console.log('❌ 商家没有关联的订单！');
        
        // 检查是否有订单但merchant_id为空
        const [unassignedOrders] = await connection.execute(`
          SELECT id, order_number, product_id, customer_name
          FROM orders 
          WHERE merchant_id IS NULL OR merchant_id = ''
        `);
        
        if (unassignedOrders.length > 0) {
          console.log(`⚠️ 发现 ${unassignedOrders.length} 个未分配商家的订单`);
          
          // 尝试通过产品关联找到正确的商家
          for (const order of unassignedOrders) {
            const [productMerchant] = await connection.execute(`
              SELECT merchant_id FROM products WHERE id = ?
            `, [order.product_id]);
            
            if (productMerchant.length > 0 && productMerchant[0].merchant_id) {
              console.log(`🔄 将订单 ${order.order_number} 关联到商家 ${productMerchant[0].merchant_id}`);
              
              await connection.execute(`
                UPDATE orders 
                SET merchant_id = ? 
                WHERE id = ?
              `, [productMerchant[0].merchant_id, order.id]);
            }
          }
        }
      } else {
        merchantOrders.forEach(order => {
          console.log(`  订单号: ${order.order_number}`);
          console.log(`  客户: ${order.customer_name}`);
          console.log(`  产品: ${order.product_name || order.product_title}`);
          console.log(`  金额: ¥${order.total_price}`);
          console.log(`  状态: ${order.status}`);
          console.log('');
        });
      }
    }
    
    // 4. 测试商家订单API
    console.log('\n4️⃣ 测试商家订单API...');
    
    try {
      // 尝试登录商家用户
      if (merchants.length > 0) {
        const testMerchant = merchants[0];
        console.log(`🔐 尝试登录商家 ${testMerchant.username}...`);
        
        // 尝试不同的登录方式
        const loginAttempts = [
          { email: testMerchant.email, password: 'password123' },
          { email: testMerchant.email, password: 'merchant123' },
          { email: 'merchant@test.com', password: 'password123' }
        ];
        
        let loginSuccess = false;
        let token = null;
        
        for (const attempt of loginAttempts) {
          try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, attempt);
            
            if (loginResponse.data.success) {
              console.log(`✅ 商家登录成功: ${attempt.email}`);
              token = loginResponse.data.token;
              loginSuccess = true;
              break;
            }
          } catch (error) {
            console.log(`❌ 登录失败: ${attempt.email}`);
          }
        }
        
        if (loginSuccess && token) {
          // 测试获取商家订单
          console.log('📋 获取商家订单...');
          
          try {
            const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('📥 商家订单API响应:');
            console.log(JSON.stringify(ordersResponse.data, null, 2));
            
          } catch (error) {
            console.log('❌ 获取商家订单失败:', error.response?.data || error.message);
            
            // 尝试其他可能的端点
            const endpoints = [
              '/api/merchant/orders',
              '/api/orders/merchant',
              '/api/admin/orders'
            ];
            
            for (const endpoint of endpoints) {
              try {
                console.log(`🔍 尝试端点: ${endpoint}`);
                const response = await axios.get(`${BASE_URL}${endpoint}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  validateStatus: function (status) {
                    return status < 500;
                  }
                });
                
                console.log(`${endpoint} 响应状态: ${response.status}`);
                if (response.status === 200) {
                  console.log('✅ 找到可用的商家订单端点!');
                  console.log(JSON.stringify(response.data, null, 2));
                  break;
                }
              } catch (endpointError) {
                console.log(`${endpoint} 失败: ${endpointError.message}`);
              }
            }
          }
        } else {
          console.log('❌ 无法登录任何商家用户');
        }
      }
    } catch (error) {
      console.log('❌ 商家订单API测试失败:', error.message);
    }
    
    // 5. 检查前端错误 - 端口3003问题
    console.log('\n5️⃣ 检查前端端口配置问题...');
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // 检查前端API配置
      const apiPath = path.join(__dirname, 'frontend', 'src', 'services', 'api.ts');
      const apiCode = await fs.readFile(apiPath, 'utf8');
      
      if (apiCode.includes('3003')) {
        console.log('❌ 前端API配置使用错误端口3003');
        console.log('需要修复为端口3001');
        
        const fixedApiCode = apiCode.replace(/localhost:3003/g, 'localhost:3001');
        await fs.writeFile(apiPath, fixedApiCode);
        console.log('✅ 已修复前端API端口配置');
      } else if (apiCode.includes('3001')) {
        console.log('✅ 前端API端口配置正确');
      } else {
        console.log('⚠️ 前端API端口配置不明确');
      }
      
      // 检查是否有其他文件使用3003端口
      const frontendFiles = [
        'frontend/src/index.tsx',
        'frontend/public/index.html',
        'frontend/src/App.tsx'
      ];
      
      for (const file of frontendFiles) {
        try {
          const filePath = path.join(__dirname, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          if (content.includes('3003')) {
            console.log(`⚠️ 文件 ${file} 包含端口3003引用`);
          }
        } catch (error) {
          // 文件可能不存在
        }
      }
      
    } catch (error) {
      console.log('❌ 检查前端配置失败:', error.message);
    }
    
    // 6. 生成修复建议
    console.log('\n6️⃣ 修复建议:');
    
    const hasOrders = orders.length > 0;
    const hasMerchants = merchants.length > 0;
    const ordersWithMerchants = orders.filter(o => o.merchant_id).length;
    
    console.log(`📊 统计信息:`);
    console.log(`  - 总订单数: ${orders.length}`);
    console.log(`  - 商家用户数: ${merchants.length}`);
    console.log(`  - 已关联商家的订单: ${ordersWithMerchants}`);
    
    if (!hasOrders) {
      console.log('❌ 没有订单数据');
    } else if (!hasMerchants) {
      console.log('❌ 没有商家用户');
    } else if (ordersWithMerchants === 0) {
      console.log('❌ 订单没有正确关联到商家');
      console.log('建议: 修复订单创建时的商家关联逻辑');
    } else {
      console.log('✅ 数据关联正常');
      console.log('问题可能在于:');
      console.log('1. 商家订单API端点配置错误');
      console.log('2. 前端使用错误的端口3003');
      console.log('3. 商家认证token问题');
      console.log('4. API权限配置问题');
    }
    
    console.log('\n🔧 立即修复步骤:');
    console.log('1. 修复前端API端口配置（3003 -> 3001）');
    console.log('2. 确保订单正确关联到商家');
    console.log('3. 验证商家订单API端点');
    console.log('4. 重启前端服务器');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试脚本
debugMerchantOrdersMissing().catch(console.error);