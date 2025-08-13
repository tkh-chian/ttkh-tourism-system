const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function fixAuthThroughAPI() {
  console.log('🔧 通过API修复认证问题...');
  
  try {
    // 1. 创建正确的测试用户
    await createCorrectTestUsers();
    
    // 2. 测试所有用户登录
    await testAllUserLogins();
    
    // 3. 进行完整的功能测试
    await performCompleteTest();
    
    console.log('🎉 认证修复和测试完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
  }
}

async function createCorrectTestUsers() {
  console.log('👥 创建正确的测试用户...');
  
  const testUsers = [
    {
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      name: '系统管理员'
    },
    {
      username: 'testmerchant',
      email: 'merchant@test.com',
      password: 'merchant123',
      role: 'merchant',
      name: '测试商家',
      business_name: '测试旅游公司',
      business_license: 'BL123456789',
      contact_phone: '02-123-4567',
      address: '曼谷市中心商业区'
    },
    {
      username: 'testagent',
      email: 'agent@test.com',
      password: 'agent123',
      role: 'agent',
      name: '测试代理'
    },
    {
      username: 'testcustomer',
      email: 'customer@test.com',
      password: 'customer123',
      role: 'customer',
      name: '测试客户'
    }
  ];
  
  for (const user of testUsers) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, user);
      console.log(`✅ 创建用户成功: ${user.email} (${user.role})`);
    } catch (error) {
      if (error.response?.data?.message?.includes('已存在') || 
          error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️ 用户已存在: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️ 用户创建状态: ${user.email} - ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

async function testAllUserLogins() {
  console.log('\n🔑 测试所有用户登录...');
  
  const testAccounts = [
    { email: 'admin@test.com', password: 'admin123', role: '管理员' },
    { email: 'merchant@test.com', password: 'merchant123', role: '商家' },
    { email: 'agent@test.com', password: 'agent123', role: '代理' },
    { email: 'customer@test.com', password: 'customer123', role: '客户' }
  ];
  
  const workingAccounts = [];
  
  for (const account of testAccounts) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      if (response.data.success && response.data.token) {
        console.log(`✅ ${account.role}登录成功: ${account.email}`);
        workingAccounts.push({
          ...account,
          token: response.data.token,
          user: response.data.user
        });
      } else {
        console.log(`❌ ${account.role}登录失败: 无效响应`);
      }
      
    } catch (error) {
      console.log(`❌ ${account.role}登录失败: ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log(`\n📊 登录测试结果: ${workingAccounts.length}/${testAccounts.length} 个账号可以正常登录`);
  return workingAccounts;
}

async function performCompleteTest() {
  console.log('\n🧪 进行完整功能测试...');
  
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // 测试1: 首页产品展示
    console.log('\n1️⃣ 测试首页产品展示...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products?status=approved`);
    
    if (productsResponse.data.success && Array.isArray(productsResponse.data.data)) {
      const products = productsResponse.data.data;
      testResults.passed.push(`首页产品展示正常 (${products.length}个产品)`);
      console.log(`✅ 首页产品展示正常 (${products.length}个产品)`);
      
      products.forEach((product, index) => {
        console.log(`   产品${index + 1}: ${product.name || '未命名'} (编号: ${product.product_number || '未设置'})`);
      });
    } else {
      testResults.failed.push('首页产品展示异常');
      console.log('❌ 首页产品展示异常');
    }
    
    // 测试2: 管理员功能
    console.log('\n2️⃣ 测试管理员功能...');
    try {
      const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (adminLogin.data.success && adminLogin.data.token) {
        const adminToken = adminLogin.data.token;
        
        // 测试管理员查看商家
        try {
          const merchantsResponse = await axios.get(`${BASE_URL}/api/admin/merchants`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          if (merchantsResponse.data.success) {
            testResults.passed.push('管理员查看商家功能正常');
            console.log(`✅ 管理员查看商家功能正常 (${merchantsResponse.data.data.length}个商家)`);
          } else {
            testResults.failed.push('管理员查看商家功能异常');
            console.log('❌ 管理员查看商家功能异常');
          }
        } catch (error) {
          testResults.failed.push('管理员查看商家API错误');
          console.log('❌ 管理员查看商家API错误:', error.response?.data?.message || error.message);
        }
        
      } else {
        testResults.failed.push('管理员登录失败');
        console.log('❌ 管理员登录失败');
      }
    } catch (error) {
      testResults.failed.push('管理员功能测试失败');
      console.log('❌ 管理员功能测试失败:', error.message);
    }
    
    // 测试3: 商家功能
    console.log('\n3️⃣ 测试商家功能...');
    try {
      const merchantLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'merchant@test.com',
        password: 'merchant123'
      });
      
      if (merchantLogin.data.success && merchantLogin.data.token) {
        const merchantToken = merchantLogin.data.token;
        testResults.passed.push('商家登录功能正常');
        console.log('✅ 商家登录功能正常');
        
        // 测试商家创建产品
        try {
          const productData = {
            name: '人工测试产品-' + Date.now(),
            description: '这是一个人工测试产品，用于验证系统功能',
            price: 1500.00,
            product_number: 'PRD' + Date.now(),
            poster_image: '/downloads/test-poster.jpg',
            pdf_document: '/downloads/test-document.pdf'
          };
          
          const createResponse = await axios.post(`${BASE_URL}/api/products`, productData, {
            headers: { Authorization: `Bearer ${merchantToken}` }
          });
          
          if (createResponse.data.success) {
            testResults.passed.push('商家创建产品功能正常');
            console.log('✅ 商家创建产品功能正常');
            console.log(`   产品名称: ${productData.name}`);
            console.log(`   产品编号: ${productData.product_number}`);
          } else {
            testResults.failed.push('商家创建产品返回失败');
            console.log('❌ 商家创建产品返回失败');
          }
          
        } catch (error) {
          testResults.failed.push('商家创建产品API错误');
          console.log('❌ 商家创建产品API错误:', error.response?.data?.message || error.message);
        }
        
      } else {
        testResults.failed.push('商家登录失败');
        console.log('❌ 商家登录失败');
      }
    } catch (error) {
      testResults.failed.push('商家功能测试失败');
      console.log('❌ 商家功能测试失败:', error.message);
    }
    
    // 测试4: 代理功能
    console.log('\n4️⃣ 测试代理功能...');
    try {
      const agentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'agent@test.com',
        password: 'agent123'
      });
      
      if (agentLogin.data.success && agentLogin.data.token) {
        const agentToken = agentLogin.data.token;
        testResults.passed.push('代理登录功能正常');
        console.log('✅ 代理登录功能正常');
        
        // 测试代理查看订单
        try {
          const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${agentToken}` }
          });
          
          if (ordersResponse.data.success) {
            testResults.passed.push('代理查看订单功能正常');
            console.log(`✅ 代理查看订单功能正常 (${ordersResponse.data.data.length}个订单)`);
          } else {
            testResults.failed.push('代理查看订单功能异常');
            console.log('❌ 代理查看订单功能异常');
          }
        } catch (error) {
          testResults.failed.push('代理查看订单API错误');
          console.log('❌ 代理查看订单API错误:', error.response?.data?.message || error.message);
        }
        
      } else {
        testResults.failed.push('代理登录失败');
        console.log('❌ 代理登录失败');
      }
    } catch (error) {
      testResults.failed.push('代理功能测试失败');
      console.log('❌ 代理功能测试失败:', error.message);
    }
    
    // 生成最终测试报告
    generateHumanTestReport(testResults);
    
  } catch (error) {
    console.error('❌ 完整功能测试失败:', error.message);
  }
}

function generateHumanTestReport(testResults) {
  console.log('\n📊 生成人工测试准备报告...');
  console.log('='.repeat(80));
  console.log('🧪 系统人工测试准备完成报告');
  console.log('='.repeat(80));
  
  console.log(`\n✅ 通过的测试 (${testResults.passed.length}项):`);
  testResults.passed.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`);
  });
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ 失败的测试 (${testResults.failed.length}项):`);
    testResults.failed.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ 警告项目 (${testResults.warnings.length}项):`);
    testResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  // 计算成功率
  const totalTests = testResults.passed.length + testResults.failed.length;
  const successRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总测试项: ${totalTests}`);
  console.log(`   通过: ${testResults.passed.length}`);
  console.log(`   失败: ${testResults.failed.length}`);
  console.log(`   警告: ${testResults.warnings.length}`);
  console.log(`   成功率: ${successRate}%`);
  
  console.log(`\n🎯 人工测试指南:`);
  console.log(`   1. 前端地址: http://localhost:3000`);
  console.log(`   2. 后端地址: http://localhost:3001`);
  console.log(`   3. 系统状态: ${successRate >= 70 ? '✅ 良好' : successRate >= 50 ? '⚠️ 一般' : '❌ 需要修复'}`);
  
  console.log(`\n📋 测试账号信息:`);
  console.log(`   管理员: admin@test.com / admin123`);
  console.log(`   商家: merchant@test.com / merchant123`);
  console.log(`   代理: agent@test.com / agent123`);
  console.log(`   客户: customer@test.com / customer123`);
  
  console.log(`\n🔍 人工测试步骤:`);
  console.log(`   1. 打开浏览器访问 http://localhost:3000`);
  console.log(`   2. 尝试使用上述账号登录`);
  console.log(`   3. 测试各角色的功能:`);
  console.log(`      - 管理员: 审核商家和产品`);
  console.log(`      - 商家: 创建产品，设置价格日历`);
  console.log(`      - 代理: 查看产品，创建订单`);
  console.log(`      - 客户: 浏览产品，下单`);
  console.log(`   4. 测试文件上传功能`);
  console.log(`   5. 验证产品编号和订单编号的唯一性`);
  
  if (successRate >= 70) {
    console.log(`\n🎉 系统已准备好进行人工测试！`);
    console.log(`   大部分功能正常，可以开始人工验证。`);
  } else if (successRate >= 50) {
    console.log(`\n⚠️ 系统部分功能存在问题，但可以进行基础人工测试`);
    console.log(`   建议重点测试通过的功能，并报告发现的问题。`);
  } else {
    console.log(`\n❌ 系统存在较多问题，建议修复后再进行人工测试`);
    console.log(`   请先解决失败的测试项目。`);
  }
  
  console.log('='.repeat(80));
  console.log('🏁 人工测试准备完成！请开始人工验证。');
  console.log('='.repeat(80));
}

// 运行修复和测试
fixAuthThroughAPI().catch(console.error);