const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function optimalTestMethod() {
  console.log('🎯 最优测试方式 - 逐步验证系统功能');
  console.log('='.repeat(60));
  
  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  try {
    // 步骤1: 测试服务器连接
    console.log('\n📡 步骤1: 测试服务器连接...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      if (healthResponse.data.success) {
        console.log('✅ 后端服务器连接正常');
        testResults.passed++;
        testResults.details.push('✅ 后端服务器连接正常');
      } else {
        throw new Error('健康检查失败');
      }
    } catch (error) {
      console.log('❌ 后端服务器连接失败');
      testResults.failed++;
      testResults.details.push('❌ 后端服务器连接失败');
      return testResults;
    }
    
    // 步骤2: 测试用户注册功能
    console.log('\n👤 步骤2: 测试用户注册功能...');
    const testUser = {
      username: 'optimaltest_' + Date.now(),
      email: `optimaltest_${Date.now()}@test.com`,
      password: 'test123456',
      role: 'customer'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      
      if (registerResponse.data.success) {
        console.log('✅ 用户注册成功');
        console.log(`   用户邮箱: ${testUser.email}`);
        testResults.passed++;
        testResults.details.push('✅ 用户注册功能正常');
        
        // 步骤3: 立即测试登录功能
        console.log('\n🔑 步骤3: 测试登录功能...');
        try {
          const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
          });
          
          if (loginResponse.data.success && loginResponse.data.data.token) {
            console.log('✅ 用户登录成功');
            console.log(`   获得Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
            testResults.passed++;
            testResults.details.push('✅ 用户登录功能正常');
            
            // 步骤4: 测试Token验证
            console.log('\n🛡️ 步骤4: 测试Token验证...');
            try {
              const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
                headers: {
                  'Authorization': `Bearer ${loginResponse.data.data.token}`
                }
              });
              
              if (profileResponse.data.success) {
                console.log('✅ Token验证成功');
                console.log(`   用户角色: ${profileResponse.data.data.user.role}`);
                testResults.passed++;
                testResults.details.push('✅ Token验证功能正常');
              } else {
                throw new Error('Token验证失败');
              }
            } catch (error) {
              console.log('❌ Token验证失败:', error.response?.data?.message || error.message);
              testResults.failed++;
              testResults.details.push('❌ Token验证功能异常');
            }
            
          } else {
            throw new Error('登录响应无效');
          }
        } catch (error) {
          console.log('❌ 用户登录失败:', error.response?.data?.message || error.message);
          testResults.failed++;
          testResults.details.push('❌ 用户登录功能异常');
        }
        
      } else {
        throw new Error(registerResponse.data.message || '注册失败');
      }
    } catch (error) {
      console.log('❌ 用户注册失败:', error.response?.data?.message || error.message);
      testResults.failed++;
      testResults.details.push('❌ 用户注册功能异常');
      
      if (error.response?.data?.message?.includes('邮箱已被注册')) {
        console.log('💡 提示: 邮箱已存在，这是正常的，让我们测试现有用户登录...');
        
        // 尝试使用现有测试账号登录
        console.log('\n🔄 使用现有测试账号登录...');
        const existingAccounts = [
          { email: 'admin@test.com', password: 'admin123', role: '管理员' },
          { email: 'merchant@test.com', password: 'merchant123', role: '商家' },
          { email: 'customer@test.com', password: 'customer123', role: '客户' }
        ];
        
        for (const account of existingAccounts) {
          try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
              email: account.email,
              password: account.password
            });
            
            if (loginResponse.data.success && loginResponse.data.data.token) {
              console.log(`✅ ${account.role}登录成功: ${account.email}`);
              testResults.passed++;
              testResults.details.push(`✅ ${account.role}登录功能正常`);
              break;
            }
          } catch (loginError) {
            console.log(`❌ ${account.role}登录失败: ${loginError.response?.data?.message || loginError.message}`);
          }
        }
      }
    }
    
    // 步骤5: 测试产品列表API
    console.log('\n📦 步骤5: 测试产品列表API...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      
      if (productsResponse.data.success && Array.isArray(productsResponse.data.data)) {
        console.log(`✅ 产品列表获取成功 (${productsResponse.data.data.length}个产品)`);
        testResults.passed++;
        testResults.details.push('✅ 产品列表API正常');
        
        if (productsResponse.data.data.length > 0) {
          const product = productsResponse.data.data[0];
          console.log(`   示例产品: ${product.title_zh || product.name || '未命名'} (${product.product_number})`);
        }
      } else {
        throw new Error('产品列表响应格式错误');
      }
    } catch (error) {
      console.log('❌ 产品列表获取失败:', error.response?.data?.message || error.message);
      testResults.failed++;
      testResults.details.push('❌ 产品列表API异常');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  // 生成测试报告
  console.log('\n📊 测试结果报告');
  console.log('='.repeat(60));
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log(`总测试项: ${totalTests}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`成功率: ${successRate}%`);
  
  console.log('\n📋 详细结果:');
  testResults.details.forEach((detail, index) => {
    console.log(`   ${index + 1}. ${detail}`);
  });
  
  if (successRate >= 80) {
    console.log('\n🎉 系统状态良好！可以开始人工测试');
    console.log('\n🎯 人工测试指导:');
    console.log('1. 打开浏览器访问: http://localhost:3000');
    console.log('2. 尝试注册新用户账号');
    console.log('3. 使用注册的账号登录系统');
    console.log('4. 浏览首页产品列表');
    console.log('5. 测试各个功能模块');
    
    console.log('\n📋 可用测试账号:');
    console.log('   管理员: admin@test.com / admin123');
    console.log('   商家: merchant@test.com / merchant123');
    console.log('   客户: customer@test.com / customer123');
    
  } else if (successRate >= 50) {
    console.log('\n⚠️ 系统部分功能正常，建议谨慎测试');
    console.log('   重点测试通过的功能，记录发现的问题');
  } else {
    console.log('\n❌ 系统存在较多问题，建议修复后再测试');
    console.log('   请优先解决失败的测试项目');
  }
  
  console.log('\n🏁 最优测试完成！');
  return testResults;
}

// 运行最优测试
optimalTestMethod().catch(console.error);