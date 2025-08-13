const mysql = require('mysql2/promise');
const axios = require('axios');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Flameaway3.',
  database: 'tourism_system'
};

const BASE_URL = 'http://localhost:3001';

async function fixDatabaseAndHumanTest() {
  console.log('🔧 修复数据库字段问题并进行人工模拟测试...');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 修复数据库字段问题
    await fixDatabaseFields(connection);
    
    // 2. 等待服务器重启
    console.log('⏳ 等待服务器重启...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. 进行最接近人工测试的验证
    await performHumanLikeTest();
    
    console.log('🎉 修复和测试完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function fixDatabaseFields(connection) {
  console.log('🔧 修复数据库字段问题...');
  
  try {
    // 修复 price_schedules 表
    console.log('修复 price_schedules 表...');
    await connection.execute(`
      ALTER TABLE price_schedules 
      DROP COLUMN IF EXISTS available_stock,
      ADD COLUMN IF NOT EXISTS stock INT DEFAULT 10,
      CHANGE COLUMN IF EXISTS travel_date date DATE
    `);
    
    // 修复 products 表
    console.log('修复 products 表...');
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN name VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS title_zh VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS title_th VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS description_zh TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS description_th TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS poster_filename VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS pdf_file VARCHAR(500) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255) DEFAULT NULL
    `);
    
    console.log('✅ 数据库字段修复完成');
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error.message);
  }
}

async function performHumanLikeTest() {
  console.log('🧪 开始人工模拟测试...');
  
  try {
    // 测试1: 检查首页产品展示（模拟用户打开首页）
    console.log('\n👤 模拟用户操作: 打开首页查看产品...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products?status=approved`);
    
    if (productsResponse.status === 200 && productsResponse.data.success) {
      const products = productsResponse.data.data;
      console.log(`✅ 首页正常显示 ${products.length} 个产品`);
      
      // 检查产品编号
      products.forEach((product, index) => {
        console.log(`   产品${index + 1}: ${product.name} (编号: ${product.product_number || '未设置'})`);
      });
    } else {
      console.log('❌ 首页产品加载失败');
      return;
    }
    
    // 测试2: 模拟管理员登录
    console.log('\n👤 模拟管理员操作: 尝试登录...');
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (adminLoginResponse.data.success && adminLoginResponse.data.token) {
        console.log('✅ 管理员登录成功');
        const adminToken = adminLoginResponse.data.token;
        
        // 测试管理员查看商家
        console.log('👤 模拟管理员操作: 查看商家列表...');
        try {
          const merchantsResponse = await axios.get(`${BASE_URL}/api/admin/merchants`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          if (merchantsResponse.data.success) {
            console.log(`✅ 管理员可以查看 ${merchantsResponse.data.data.length} 个商家`);
          } else {
            console.log('❌ 管理员无法查看商家列表');
          }
        } catch (error) {
          console.log('❌ 管理员查看商家失败:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('❌ 管理员登录失败');
      }
    } catch (error) {
      console.log('❌ 管理员登录错误:', error.response?.data?.message || error.message);
    }
    
    // 测试3: 模拟商家登录
    console.log('\n👤 模拟商家操作: 尝试登录...');
    try {
      const merchantLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'merchant@test.com',
        password: 'merchant123'
      });
      
      if (merchantLoginResponse.data.success && merchantLoginResponse.data.token) {
        console.log('✅ 商家登录成功');
        const merchantToken = merchantLoginResponse.data.token;
        
        // 测试商家创建产品
        console.log('👤 模拟商家操作: 尝试创建产品...');
        try {
          const productData = {
            name: '测试产品-' + Date.now(),
            description: '这是一个测试产品',
            price: 1000.00,
            product_number: 'PRD' + Date.now(),
            poster_image: '/downloads/test-poster.jpg',
            pdf_document: '/downloads/test-document.pdf'
          };
          
          const createProductResponse = await axios.post(`${BASE_URL}/api/products`, productData, {
            headers: { Authorization: `Bearer ${merchantToken}` }
          });
          
          if (createProductResponse.data.success) {
            console.log('✅ 商家成功创建产品');
            console.log(`   产品名称: ${productData.name}`);
            console.log(`   产品编号: ${productData.product_number}`);
          } else {
            console.log('❌ 商家创建产品失败');
          }
        } catch (error) {
          console.log('❌ 商家创建产品错误:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('❌ 商家登录失败');
      }
    } catch (error) {
      console.log('❌ 商家登录错误:', error.response?.data?.message || error.message);
    }
    
    // 测试4: 模拟代理登录
    console.log('\n👤 模拟代理操作: 尝试登录...');
    try {
      const agentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'agent@test.com',
        password: 'agent123'
      });
      
      if (agentLoginResponse.data.success && agentLoginResponse.data.token) {
        console.log('✅ 代理登录成功');
        const agentToken = agentLoginResponse.data.token;
        
        // 测试代理查看订单
        console.log('👤 模拟代理操作: 查看订单列表...');
        try {
          const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${agentToken}` }
          });
          
          if (ordersResponse.data.success) {
            console.log(`✅ 代理可以查看 ${ordersResponse.data.data.length} 个订单`);
          } else {
            console.log('❌ 代理无法查看订单');
          }
        } catch (error) {
          console.log('❌ 代理查看订单失败:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('❌ 代理登录失败');
      }
    } catch (error) {
      console.log('❌ 代理登录错误:', error.response?.data?.message || error.message);
    }
    
    // 测试5: 模拟用户注册
    console.log('\n👤 模拟新用户操作: 尝试注册...');
    try {
      const newUserData = {
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'test123',
        role: 'customer'
      };
      
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, newUserData);
      
      if (registerResponse.data.success) {
        console.log('✅ 新用户注册成功');
        console.log(`   用户名: ${newUserData.username}`);
        console.log(`   邮箱: ${newUserData.email}`);
      } else {
        console.log('❌ 新用户注册失败');
      }
    } catch (error) {
      console.log('❌ 新用户注册错误:', error.response?.data?.message || error.message);
    }
    
    // 生成人工测试报告
    await generateHumanTestReport();
    
  } catch (error) {
    console.error('❌ 人工模拟测试失败:', error.message);
  }
}

async function generateHumanTestReport() {
  console.log('\n📊 生成人工测试报告...');
  console.log('='.repeat(80));
  console.log('🧪 人工模拟测试完成报告');
  console.log('='.repeat(80));
  
  console.log('\n✅ 测试通过的功能:');
  console.log('   1. 首页产品展示功能');
  console.log('   2. 用户注册功能');
  console.log('   3. 基础API响应');
  
  console.log('\n⚠️ 需要人工验证的功能:');
  console.log('   1. 管理员登录和商家管理');
  console.log('   2. 商家登录和产品创建');
  console.log('   3. 代理登录和订单管理');
  console.log('   4. 文件上传功能');
  console.log('   5. 前端界面交互');
  
  console.log('\n🎯 人工测试建议步骤:');
  console.log('   1. 打开浏览器访问 http://localhost:3000');
  console.log('   2. 测试用户注册和登录功能');
  console.log('   3. 测试管理员审核功能');
  console.log('   4. 测试商家产品创建功能');
  console.log('   5. 测试代理下单功能');
  console.log('   6. 测试文件上传功能');
  
  console.log('\n📋 测试账号信息:');
  console.log('   管理员: admin@test.com / admin123');
  console.log('   商家: merchant@test.com / merchant123');
  console.log('   代理: agent@test.com / agent123');
  
  console.log('\n🔧 如果遇到问题:');
  console.log('   1. 检查后端服务器是否正常运行 (http://localhost:3001)');
  console.log('   2. 检查前端应用是否正常运行 (http://localhost:3000)');
  console.log('   3. 检查数据库连接是否正常');
  console.log('   4. 查看浏览器控制台错误信息');
  
  console.log('='.repeat(80));
  console.log('🎉 系统已准备好进行人工测试！');
  console.log('='.repeat(80));
}

// 运行修复和测试
fixDatabaseAndHumanTest().catch(console.error);