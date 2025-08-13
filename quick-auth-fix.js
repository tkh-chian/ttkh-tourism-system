const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function quickAuthFix() {
  console.log('🔧 快速修复认证问题...');
  
  try {
    // 1. 测试服务器连接
    console.log('📡 测试服务器连接...');
    const healthCheck = await axios.get(`${BASE_URL}/api/products`);
    console.log('✅ 服务器连接正常');
    
    // 2. 创建新的测试用户
    console.log('\n👤 创建新测试用户...');
    const newUsers = [
      {
        username: 'quicktest_admin',
        email: 'quicktest_admin@test.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'quicktest_merchant',
        email: 'quicktest_merchant@test.com',
        password: 'merchant123',
        role: 'merchant',
        business_name: '快速测试商家',
        business_license: 'QL001',
        contact_phone: '02-111-1111',
        address: '测试地址'
      },
      {
        username: 'quicktest_customer',
        email: 'quicktest_customer@test.com',
        password: 'customer123',
        role: 'customer'
      }
    ];
    
    const createdUsers = [];
    
    for (const user of newUsers) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, user);
        if (response.data.success) {
          console.log(`✅ 成功创建: ${user.email}`);
          createdUsers.push(user);
        } else {
          console.log(`⚠️ 创建状态: ${user.email} - ${response.data.message}`);
        }
      } catch (error) {
        console.log(`⚠️ 创建状态: ${user.email} - ${error.response?.data?.message || '可能已存在'}`);
      }
    }
    
    // 3. 测试登录功能
    console.log('\n🔑 测试登录功能...');
    const workingAccounts = [];
    
    for (const user of newUsers) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        if (loginResponse.data.success && loginResponse.data.token) {
          console.log(`✅ ${user.role}登录成功: ${user.email}`);
          workingAccounts.push({
            ...user,
            token: loginResponse.data.token
          });
        } else {
          console.log(`❌ ${user.role}登录失败: 无效响应`);
        }
        
      } catch (error) {
        console.log(`❌ ${user.role}登录失败: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 4. 测试基本功能
    console.log('\n🧪 测试基本功能...');
    
    // 测试产品列表
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      if (productsResponse.data.success && Array.isArray(productsResponse.data.data)) {
        console.log(`✅ 产品列表正常 (${productsResponse.data.data.length}个产品)`);
      } else {
        console.log('❌ 产品列表异常');
      }
    } catch (error) {
      console.log('❌ 产品列表API错误');
    }
    
    // 5. 生成人工测试报告
    console.log('\n📊 生成人工测试报告...');
    console.log('='.repeat(60));
    console.log('🧪 快速认证修复完成报告');
    console.log('='.repeat(60));
    
    console.log(`\n✅ 可用账号 (${workingAccounts.length}个):`);
    workingAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.role}: ${account.email} / ${account.password}`);
    });
    
    console.log(`\n🎯 人工测试指导:`);
    console.log(`   1. 前端地址: http://localhost:3000`);
    console.log(`   2. 后端地址: http://localhost:3001`);
    console.log(`   3. 系统状态: ${workingAccounts.length > 0 ? '✅ 可以开始测试' : '❌ 需要进一步修复'}`);
    
    if (workingAccounts.length > 0) {
      console.log(`\n🔍 建议测试步骤:`);
      console.log(`   1. 打开浏览器访问 http://localhost:3000`);
      console.log(`   2. 使用上述账号登录`);
      console.log(`   3. 测试各个功能模块`);
      console.log(`   4. 报告发现的问题`);
      
      console.log(`\n🎉 认证系统修复成功！可以开始人工测试。`);
    } else {
      console.log(`\n❌ 认证系统仍有问题，需要进一步调试。`);
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 快速修复失败:', error.message);
    console.log('\n🔍 可能的问题:');
    console.log('   1. 后端服务器未启动');
    console.log('   2. 数据库连接问题');
    console.log('   3. API端点配置错误');
    console.log('\n💡 建议检查服务器状态和数据库连接');
  }
}

// 运行快速修复
quickAuthFix().catch(console.error);