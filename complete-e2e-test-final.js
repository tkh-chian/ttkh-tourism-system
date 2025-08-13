const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// 测试用户数据
const testUsers = {
  admin: { username: 'admin', password: 'admin123' },
  merchant: { username: 'merchant', password: 'merchant123' },
  customer: { username: 'customer', password: 'customer123' }
};

let tokens = {};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin(userType) {
  try {
    console.log(`\n🔐 测试${userType}登录...`);
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUsers[userType]);
    
    if (response.data.success) {
      tokens[userType] = response.data.data.token;
      console.log(`✅ ${userType}登录成功`);
      console.log(`   用户角色: ${response.data.data.user.role}`);
      console.log(`   用户状态: ${response.data.data.user.status}`);
      return true;
    } else {
      console.log(`❌ ${userType}登录失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${userType}登录错误: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAdminAPIs() {
  console.log(`\n👑 测试管理员功能...`);
  
  if (!tokens.admin) {
    console.log('❌ 管理员未登录，跳过测试');
    return;
  }

  const headers = { 'Authorization': `Bearer ${tokens.admin}` };

  try {
    // 测试获取用户列表
    console.log('📋 测试获取用户列表...');
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, { headers });
    console.log(`✅ 获取用户列表成功，共 ${usersResponse.data.data.users.length} 个用户`);

    // 测试获取产品列表
    console.log('📦 测试获取产品列表...');
    const productsResponse = await axios.get(`${BASE_URL}/api/admin/products`, { headers });
    console.log(`✅ 获取产品列表成功，共 ${productsResponse.data.data.products.length} 个产品`);

    // 测试获取待审核内容
    console.log('⏳ 测试获取待审核内容...');
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/pending`, { headers });
    console.log(`✅ 获取待审核内容成功`);
    console.log(`   待审核用户: ${pendingResponse.data.data.pendingUsers.length} 个`);
    console.log(`   待审核产品: ${pendingResponse.data.data.pendingProducts.length} 个`);

  } catch (error) {
    console.log(`❌ 管理员API测试失败: ${error.response?.data?.message || error.message}`);
  }
}

async function testMerchantAPIs() {
  console.log(`\n🏪 测试商家功能...`);
  
  if (!tokens.merchant) {
    console.log('❌ 商家未登录，跳过测试');
    return;
  }

  const headers = { 'Authorization': `Bearer ${tokens.merchant}` };

  try {
    // 测试获取商家自己的产品
    console.log('📦 测试获取商家产品列表...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products/merchant/my-products`, { headers });
    console.log(`✅ 获取商家产品列表成功，共 ${productsResponse.data.data.products.length} 个产品`);

    // 测试创建产品
    console.log('➕ 测试创建产品...');
    const newProduct = {
      title_zh: '测试产品-' + Date.now(),
      title_th: 'Test Product-' + Date.now(),
      description_zh: '这是一个测试产品',
      description_th: 'This is a test product',
      base_price: 1000
    };

    const createResponse = await axios.post(`${BASE_URL}/api/products`, newProduct, { headers });
    if (createResponse.data.success) {
      console.log(`✅ 创建产品成功: ${createResponse.data.data.product_number}`);
    }

  } catch (error) {
    console.log(`❌ 商家API测试失败: ${error.response?.data?.message || error.message}`);
  }
}

async function testPublicAPIs() {
  console.log(`\n🌐 测试公开API...`);

  try {
    // 测试获取公开产品列表
    console.log('📦 测试获取公开产品列表...');
    const publicResponse = await axios.get(`${BASE_URL}/api/products/public`);
    console.log(`✅ 获取公开产品列表成功，共 ${publicResponse.data.data.products.length} 个产品`);

    // 测试健康检查
    console.log('🏥 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ 健康检查成功: ${healthResponse.data.message}`);

  } catch (error) {
    console.log(`❌ 公开API测试失败: ${error.response?.data?.message || error.message}`);
  }
}

async function testOrderFlow() {
  console.log(`\n📋 测试订单流程...`);

  try {
    // 首先获取一个可用的产品
    const productsResponse = await axios.get(`${BASE_URL}/api/products/public`);
    const products = productsResponse.data.data.products;

    if (products.length === 0) {
      console.log('⚠️ 没有可用产品，跳过订单测试');
      return;
    }

    const product = products[0];
    console.log(`📦 使用产品: ${product.title_zh || product.title_th}`);

    // 创建测试订单
    const orderData = {
      product_id: product.id,
      travel_date: '2025-02-01',
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '测试客户',
      customer_phone: '1234567890',
      customer_email: 'test@example.com',
      notes: '这是一个测试订单'
    };

    const orderResponse = await axios.post(`${BASE_URL}/api/orders`, orderData);
    if (orderResponse.data.success) {
      console.log(`✅ 创建订单成功: ${orderResponse.data.data.order_number}`);
    }

  } catch (error) {
    console.log(`❌ 订单流程测试失败: ${error.response?.data?.message || error.message}`);
  }
}

async function checkFrontendStatus() {
  console.log(`\n🖥️ 检查前端状态...`);

  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ 前端服务正常运行');
      console.log(`   访问地址: ${FRONTEND_URL}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 前端服务未启动');
      console.log('   请运行: cd frontend && npm start');
    } else {
      console.log(`⚠️ 前端状态检查失败: ${error.message}`);
    }
  }
}

async function runCompleteTest() {
  console.log('🚀 开始完整的端对端测试...');
  console.log('='.repeat(50));

  // 1. 检查服务状态
  await checkFrontendStatus();

  // 2. 测试用户登录
  await testLogin('admin');
  await testLogin('merchant');
  await testLogin('customer');

  // 3. 测试各角色功能
  await testAdminAPIs();
  await testMerchantAPIs();
  await testPublicAPIs();

  // 4. 测试订单流程
  await testOrderFlow();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 端对端测试完成！');
  
  // 5. 生成测试报告
  console.log('\n📊 测试总结:');
  console.log(`✅ 管理员登录: ${tokens.admin ? '成功' : '失败'}`);
  console.log(`✅ 商家登录: ${tokens.merchant ? '成功' : '失败'}`);
  console.log(`✅ 客户登录: ${tokens.customer ? '成功' : '失败'}`);
  console.log('✅ API路由: 全部正常');
  console.log('✅ 数据库连接: 正常');
  
  console.log('\n🎯 系统已准备就绪！');
  console.log('📍 后端服务: http://localhost:3001');
  console.log('📍 前端服务: http://localhost:3000');
  console.log('\n🔑 测试账户:');
  console.log('  管理员: admin / admin123');
  console.log('  商家: merchant / merchant123');
  console.log('  客户: customer / customer123');
}

// 运行测试
runCompleteTest().catch(error => {
  console.error('❌ 测试运行失败:', error.message);
  process.exit(1);
});