const axios = require('axios');
const fs = require('fs');

console.log('🚀 TTKH旅游系统功能测试');
console.log('='.repeat(50));

// 测试配置
const BASE_URL = 'http://localhost:3001';
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@ttkh.com',
    password: 'admin123'
  },
  merchant: {
    email: 'merchant@test.com',
    password: '123456'
  },
  agent: {
    email: 'agent@test.com',
    password: '123456'
  },
  customer: {
    email: 'user@test.com',
    password: '123456'
  }
};

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试后端健康检查
async function testBackendHealth() {
  try {
    console.log('\n🔍 测试后端服务健康状态...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ 后端服务健康检查通过');
    return true;
  } catch (error) {
    console.log('   ❌ 后端服务未响应');
    return false;
  }
}

// 测试用户登录
async function testUserLogin(role) {
  try {
    console.log(`\n🔐 测试${role}登录...`);
    const account = TEST_ACCOUNTS[role];
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: account.email,
      password: account.password
    });
    
    if (response.data.success) {
      console.log(`   ✅ ${role}登录成功`);
      return response.data.data.token;
    } else {
      console.log(`   ❌ ${role}登录失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ ${role}登录异常: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试获取产品列表
async function testGetProducts() {
  try {
    console.log('\n🛍️ 测试获取产品列表...');
    const response = await axios.get(`${BASE_URL}/api/products`);
    
    if (response.data.success) {
      console.log(`   ✅ 成功获取产品列表，共${response.data.data.products.length}个产品`);
      return true;
    } else {
      console.log(`   ❌ 获取产品列表失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 获取产品列表异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('开始系统功能测试...\n');
  
  // 等待服务启动
  console.log('⏳ 等待服务完全启动(30秒)...');
  await delay(30000);
  
  // 1. 测试后端健康状态
  const isBackendHealthy = await testBackendHealth();
  if (!isBackendHealthy) {
    console.log('\n❌ 后端服务未正常启动，测试终止');
    return;
  }
  
  // 2. 测试各角色登录
  const adminToken = await testUserLogin('admin');
  const merchantToken = await testUserLogin('merchant');
  const agentToken = await testUserLogin('agent');
  const customerToken = await testUserLogin('customer');
  
  // 3. 测试获取产品列表
  await testGetProducts();
  
  // 4. 输出测试总结
  console.log('\n📋 测试总结:');
  console.log(`   后端服务: ${isBackendHealthy ? '✅ 正常' : '❌ 异常'}`);
  console.log(`   管理员登录: ${adminToken ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   商家登录: ${merchantToken ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   代理登录: ${agentToken ? '✅ 成功' : '❌ 失败'}`);
  console.log(`   用户登录: ${customerToken ? '✅ 成功' : '❌ 失败'}`);
  
  console.log('\n🎉 系统测试完成！');
  console.log('\n🌐 请访问以下地址进行人工验证:');
  console.log('   前端界面: http://localhost:3000');
  console.log('   后端接口: http://localhost:3001');
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中出现未预期的错误:', error.message);
});