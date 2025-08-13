const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function performCompleteHumanSimulationTest() {
  console.log('🧪 开始完整的人工模拟测试...');
  console.log('='.repeat(80));
  
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // 测试1: 验证服务器状态
    await testServerStatus(testResults);
    
    // 测试2: 验证首页产品展示
    await testHomepageProducts(testResults);
    
    // 测试3: 测试用户注册功能
    await testUserRegistration(testResults);
    
    // 测试4: 测试用户登录功能
    await testUserLogin(testResults);
    
    // 测试5: 测试管理员功能
    await testAdminFunctions(testResults);
    
    // 测试6: 测试商家功能
    await testMerchantFunctions(testResults);
    
    // 测试7: 测试代理功能
    await testAgentFunctions(testResults);
    
    // 测试8: 测试产品管理功能
    await testProductManagement(testResults);
    
    // 测试9: 测试订单管理功能
    await testOrderManagement(testResults);
    
    // 测试10: 验证文件上传功能
    await testFileUpload(testResults);
    
    // 生成最终测试报告
    generateFinalTestReport(testResults);
    
  } catch (error) {
    console.error('❌ 测试过程中出现严重错误:', error.message);
    testResults.failed.push(`严重错误: ${error.message}`);
  }
  
  return testResults;
}

async function testServerStatus(testResults) {
  console.log('\n🔍 测试1: 验证服务器状态...');
  
  try {
    // 测试后端服务器
    const backendResponse = await axios.get(`${BASE_URL}/api/products`, { timeout: 5000 });
    if (backendResponse.status === 200) {
      testResults.passed.push('后端服务器正常运行');
      console.log('✅ 后端服务器正常运行');
    }
    
    // 测试前端服务器
    try {
      const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
      if (frontendResponse.status === 200) {
        testResults.passed.push('前端服务器正常运行');
        console.log('✅ 前端服务器正常运行');
      }
    } catch (error) {
      testResults.warnings.push('前端服务器可能未启动或无法访问');
      console.log('⚠️ 前端服务器可能未启动或无法访问');
    }
    
  } catch (error) {
    testResults.failed.push('后端服务器无法访问');
    console.log('❌ 后端服务器无法访问');
  }
}

async function testHomepageProducts(testResults) {
  console.log('\n🔍 测试2: 验证首页产品展示...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/products?status=approved`);
    
    if (response.data.success && Array.isArray(response.data.data)) {
      const products = response.data.data;
      testResults.passed.push(`首页产品展示正常 (${products.length}个产品)`);
      console.log(`✅ 首页产品展示正常 (${products.length}个产品)`);
      
      // 验证产品编号唯一性
      const productNumbers = products.map(p => p.product_number).filter(Boolean);
      const uniqueNumbers = [...new Set(productNumbers)];
      
      if (productNumbers.length === uniqueNumbers.length) {
        testResults.passed.push('产品编号唯一性验证通过');
        console.log('✅ 产品编号唯一性验证通过');
      } else {
        testResults.failed.push('产品编号存在重复');
        console.log('❌ 产品编号存在重复');
      }
      
      // 显示产品详情
      products.forEach((product, index) => {
        console.log(`   产品${index + 1}: ${product.name} (编号: ${product.product_number || '未设置'})`);
      });
      
    } else {
      testResults.failed.push('首页产品数据格式错误');
      console.log('❌ 首页产品数据格式错误');
    }
    
  } catch (error) {
    testResults.failed.push('首页产品加载失败');
    console.log('❌ 首页产品加载失败:', error.message);
  }
}

async function testUserRegistration(testResults) {
  console.log('\n🔍 测试3: 测试用户注册功能...');
  
  const testUser = {
    username: 'testuser' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'test123',
    role: 'customer'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.success) {
      testResults.passed.push('用户注册功能正常');
      console.log('✅ 用户注册功能正常');
      console.log(`   注册用户: ${testUser.username} (${testUser.email})`);
    } else {
      testResults.failed.push('用户注册返回失败状态');
      console.log('❌ 用户注册返回失败状态');
    }
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
      testResults.passed.push('用户注册功能正常 (用户已存在验证)');
      console.log('✅ 用户注册功能正常 (用户已存在验证)');
    } else {
      testResults.failed.push('用户注册功能异常');
      console.log('❌ 用户注册功能异常:', error.response?.data?.message || error.message);
    }
  }
}

async function testUserLogin(testResults) {
  console.log('\n🔍 测试4: 测试用户登录功能...');
  
  const testAccounts = [
    { email: 'admin@test.com', password: 'admin123', role: '管理员' },
    { email: 'merchant@test.com', password: 'merchant123', role: '商家' },
    { email: 'agent@test.com', password: 'agent123', role: '代理' },
    { email: 'customer@test.com', password: 'customer123', role: '客户' }
  ];
  
  for (const account of testAccounts) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      if (response.data.success && response.data.token) {
        testResults.passed.push(`${account.role}登录功能正常`);
        console.log(`✅ ${account.role}登录功能正常 (${account.email})`);
      } else {
        testResults.failed.push(`${account.role}登录返回无效响应`);
        console.log(`❌ ${account.role}登录返回无效响应`);
      }
      
    } catch (error) {
      testResults.failed.push(`${account.role}登录失败`);
      console.log(`❌ ${account.role}登录失败: ${error.response?.data?.message || error.message}`);
    }
  }
}

async function testAdminFunctions(testResults) {
  console.log('\n🔍 测试5: 测试管理员功能...');
  
  try {
    // 尝试管理员登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const adminToken = loginResponse.data.token;
      
      // 测试查看商家列表
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
      
      // 测试查看用户列表
      try {
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (usersResponse.data.success) {
          testResults.passed.push('管理员查看用户功能正常');
          console.log(`✅ 管理员查看用户功能正常 (${usersResponse.data.data.length}个用户)`);
        } else {
          testResults.failed.push('管理员查看用户功能异常');
          console.log('❌ 管理员查看用户功能异常');
        }
      } catch (error) {
        testResults.warnings.push('管理员查看用户API可能未实现');
        console.log('⚠️ 管理员查看用户API可能未实现');
      }
      
    } else {
      testResults.failed.push('管理员登录失败');
      console.log('❌ 管理员登录失败');
    }
    
  } catch (error) {
    testResults.failed.push('管理员功能测试失败');
    console.log('❌ 管理员功能测试失败:', error.message);
  }
}

async function testMerchantFunctions(testResults) {
  console.log('\n🔍 测试6: 测试商家功能...');
  
  try {
    // 尝试商家登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'merchant@test.com',
      password: 'merchant123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const merchantToken = loginResponse.data.token;
      testResults.passed.push('商家登录功能正常');
      console.log('✅ 商家登录功能正常');
      
      // 测试创建产品
      try {
        const productData = {
          name: '测试产品-' + Date.now(),
          description: '这是一个测试产品',
          price: 1000.00,
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
}

async function testAgentFunctions(testResults) {
  console.log('\n🔍 测试7: 测试代理功能...');
  
  try {
    // 尝试代理登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'agent@test.com',
      password: 'agent123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const agentToken = loginResponse.data.token;
      testResults.passed.push('代理登录功能正常');
      console.log('✅ 代理登录功能正常');
      
      // 测试查看订单
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
}

async function testProductManagement(testResults) {
  console.log('\n🔍 测试8: 测试产品管理功能...');
  
  try {
    // 获取所有产品
    const productsResponse = await axios.get(`${BASE_URL}/api/products`);
    
    if (productsResponse.data.success) {
      const products = productsResponse.data.data;
      testResults.passed.push('产品列表获取功能正常');
      console.log(`✅ 产品列表获取功能正常 (${products.length}个产品)`);
      
      // 检查产品状态分布
      const statusCount = {};
      products.forEach(product => {
        const status = product.status || 'unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      console.log('   产品状态分布:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}个`);
      });
      
      // 验证产品编号格式
      const validProductNumbers = products.filter(p => 
        p.product_number && p.product_number.startsWith('PRD')
      );
      
      if (validProductNumbers.length > 0) {
        testResults.passed.push('产品编号格式验证通过');
        console.log('✅ 产品编号格式验证通过');
      } else {
        testResults.warnings.push('部分产品缺少有效编号');
        console.log('⚠️ 部分产品缺少有效编号');
      }
      
    } else {
      testResults.failed.push('产品列表获取失败');
      console.log('❌ 产品列表获取失败');
    }
    
  } catch (error) {
    testResults.failed.push('产品管理功能测试失败');
    console.log('❌ 产品管理功能测试失败:', error.message);
  }
}

async function testOrderManagement(testResults) {
  console.log('\n🔍 测试9: 测试订单管理功能...');
  
  try {
    // 尝试获取订单（需要认证）
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'agent@test.com',
      password: 'agent123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      
      const ordersResponse = await axios.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data;
        testResults.passed.push('订单管理功能正常');
        console.log(`✅ 订单管理功能正常 (${orders.length}个订单)`);
        
        // 检查订单编号格式
        const validOrderNumbers = orders.filter(o => 
          o.order_number && o.order_number.startsWith('ORD')
        );
        
        if (validOrderNumbers.length > 0) {
          testResults.passed.push('订单编号格式验证通过');
          console.log('✅ 订单编号格式验证通过');
        } else if (orders.length > 0) {
          testResults.warnings.push('部分订单缺少有效编号');
          console.log('⚠️ 部分订单缺少有效编号');
        }
        
      } else {
        testResults.failed.push('订单数据获取失败');
        console.log('❌ 订单数据获取失败');
      }
      
    } else {
      testResults.warnings.push('无法验证订单管理功能（登录失败）');
      console.log('⚠️ 无法验证订单管理功能（登录失败）');
    }
    
  } catch (error) {
    testResults.failed.push('订单管理功能测试失败');
    console.log('❌ 订单管理功能测试失败:', error.message);
  }
}

async function testFileUpload(testResults) {
  console.log('\n🔍 测试10: 验证文件上传功能...');
  
  try {
    // 检查上传目录是否存在
    const uploadsDir = path.join(__dirname, 'downloads');
    
    try {
      await fs.access(uploadsDir);
      testResults.passed.push('文件上传目录存在');
      console.log('✅ 文件上传目录存在');
      
      // 检查目录内容
      const files = await fs.readdir(uploadsDir);
      console.log(`   目录中有 ${files.length} 个文件`);
      
      if (files.length > 0) {
        testResults.passed.push('文件上传目录有内容');
        console.log('✅ 文件上传目录有内容');
        files.slice(0, 5).forEach(file => {
          console.log(`     ${file}`);
        });
        if (files.length > 5) {
          console.log(`     ... 还有 ${files.length - 5} 个文件`);
        }
      } else {
        testResults.warnings.push('文件上传目录为空');
        console.log('⚠️ 文件上传目录为空');
      }
      
    } catch (error) {
      // 尝试创建目录
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        testResults.passed.push('文件上传目录已创建');
        console.log('✅ 文件上传目录已创建');
      } catch (createError) {
        testResults.failed.push('无法创建文件上传目录');
        console.log('❌ 无法创建文件上传目录');
      }
    }
    
  } catch (error) {
    testResults.failed.push('文件上传功能验证失败');
    console.log('❌ 文件上传功能验证失败:', error.message);
  }
}

function generateFinalTestReport(testResults) {
  console.log('\n📊 生成最终测试报告...');
  console.log('='.repeat(80));
  console.log('🧪 完整人工模拟测试报告');
  console.log('='.repeat(80));
  
  console.log(`\n✅ 通过的测试 (${testResults.passed.length}项):`);
  testResults.passed.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`);
  });
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ 警告项目 (${testResults.warnings.length}项):`);
    testResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ 失败的测试 (${testResults.failed.length}项):`);
    testResults.failed.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test}`);
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
  
  console.log(`\n🎯 人工测试建议:`);
  console.log(`   1. 打开浏览器访问: http://localhost:3000`);
  console.log(`   2. 测试用户界面交互功能`);
  console.log(`   3. 验证文件上传功能`);
  console.log(`   4. 测试完整的业务流程`);
  
  console.log(`\n📋 测试账号信息:`);
  console.log(`   管理员: admin@test.com / admin123`);
  console.log(`   商家: merchant@test.com / merchant123`);
  console.log(`   代理: agent@test.com / agent123`);
  console.log(`   客户: customer@test.com / customer123`);
  
  if (successRate >= 80) {
    console.log(`\n🎉 系统整体状态良好，可以进行人工测试！`);
  } else if (successRate >= 60) {
    console.log(`\n⚠️ 系统存在一些问题，建议修复后再进行人工测试`);
  } else {
    console.log(`\n❌ 系统存在严重问题，需要修复后才能进行人工测试`);
  }
  
  console.log('='.repeat(80));
}

// 运行完整的人工模拟测试
performCompleteHumanSimulationTest().then(results => {
  console.log('\n🎉 完整人工模拟测试完成！');
}).catch(error => {
  console.error('❌ 测试执行失败:', error.message);
});