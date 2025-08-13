const axios = require('axios');

// API基础URL
const API_BASE = 'http://localhost:3001';

async function completeE2EVerification() {
  console.log('🚀 开始完整端对端验证测试...\n');
  
  let testResults = {
    backend: false,
    adminAuth: false,
    merchantsAPI: false,
    productsAPI: false,
    ordersAPI: false,
    frontend: false
  };
  
  try {
    // 1. 测试后端健康状态
    console.log('🔍 1. 测试后端健康状态...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/api/health`);
      if (healthResponse.data.status === 'OK') {
        console.log('✅ 后端服务器运行正常');
        testResults.backend = true;
      }
    } catch (error) {
      console.log('❌ 后端服务器连接失败');
    }
    
    // 2. 测试管理员认证
    console.log('\n🔐 2. 测试管理员认证...');
    let adminToken = null;
    try {
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'admin@ttkh.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
        adminToken = loginResponse.data.data.token;
        console.log('✅ 管理员登录成功');
        testResults.adminAuth = true;
      }
    } catch (error) {
      console.log('❌ 管理员登录失败');
    }
    
    if (!adminToken) {
      console.log('❌ 无法获取管理员token，停止后续测试');
      return testResults;
    }
    
    // 3. 测试商家管理API
    console.log('\n👥 3. 测试商家管理API...');
    try {
      const merchantsResponse = await axios.get(`${API_BASE}/api/admin/merchants`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (merchantsResponse.data.success) {
        console.log('✅ 商家管理API正常');
        console.log(`📊 商家数量: ${merchantsResponse.data.data?.users?.length || 0}`);
        testResults.merchantsAPI = true;
      }
    } catch (error) {
      console.log('❌ 商家管理API失败');
    }
    
    // 4. 测试产品管理API
    console.log('\n📦 4. 测试产品管理API...');
    try {
      const productsResponse = await axios.get(`${API_BASE}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (productsResponse.data.success) {
        console.log('✅ 产品管理API正常');
        console.log(`📊 产品数量: ${productsResponse.data.data?.products?.length || 0}`);
        testResults.productsAPI = true;
      }
    } catch (error) {
      console.log('❌ 产品管理API失败');
    }
    
    // 5. 测试订单管理API
    console.log('\n📋 5. 测试订单管理API...');
    try {
      const ordersResponse = await axios.get(`${API_BASE}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (ordersResponse.data.success) {
        console.log('✅ 订单管理API正常');
        console.log(`📊 订单数量: ${ordersResponse.data.data?.orders?.length || 0}`);
        testResults.ordersAPI = true;
      }
    } catch (error) {
      console.log('❌ 订单管理API失败');
    }
    
    // 6. 测试前端可访问性
    console.log('\n🌐 6. 测试前端可访问性...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000');
      if (frontendResponse.status === 200) {
        console.log('✅ 前端服务器运行正常');
        testResults.frontend = true;
      }
    } catch (error) {
      console.log('❌ 前端服务器连接失败');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  // 生成测试报告
  console.log('\n📊 测试结果汇总:');
  console.log('==================');
  console.log(`后端服务器: ${testResults.backend ? '✅ 正常' : '❌ 异常'}`);
  console.log(`管理员认证: ${testResults.adminAuth ? '✅ 正常' : '❌ 异常'}`);
  console.log(`商家管理API: ${testResults.merchantsAPI ? '✅ 正常' : '❌ 异常'}`);
  console.log(`产品管理API: ${testResults.productsAPI ? '✅ 正常' : '❌ 异常'}`);
  console.log(`订单管理API: ${testResults.ordersAPI ? '✅ 正常' : '❌ 异常'}`);
  console.log(`前端服务器: ${testResults.frontend ? '✅ 正常' : '❌ 异常'}`);
  
  const successCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = Object.keys(testResults).length;
  
  console.log(`\n🎯 总体成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！系统运行正常。');
    console.log('\n📋 下一步操作:');
    console.log('1. 在浏览器中访问 http://localhost:3000');
    console.log('2. 按F12打开开发者工具，在控制台执行:');
    console.log(`   localStorage.setItem('token', '${adminToken}');`);
    console.log(`   localStorage.setItem('user', '${JSON.stringify({id:"0461df54-3846-4f7a-be24-262fcbe4d30d",username:"admin@ttkh.com",email:"admin@ttkh.com",role:"admin"})}');`);
    console.log('3. 刷新页面后访问 http://localhost:3000/admin/merchants');
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查。');
  }
  
  return testResults;
}

completeE2EVerification().catch(console.error);