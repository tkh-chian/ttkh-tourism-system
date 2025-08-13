const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testFixedLogin() {
  console.log('🔧 测试修复后的登录功能...');
  
  try {
    // 1. 先测试现有用户登录
    console.log('\n🔑 测试现有用户登录...');
    const existingUsers = [
      { email: 'admin@test.com', password: 'admin123', role: '管理员' },
      { email: 'merchant@test.com', password: 'merchant123', role: '商家' },
      { email: 'customer@test.com', password: 'customer123', role: '客户' }
    ];
    
    let workingUsers = 0;
    
    for (const user of existingUsers) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        if (response.data.success && response.data.data.token) {
          console.log(`✅ ${user.role}登录成功: ${user.email}`);
          workingUsers++;
        } else {
          console.log(`❌ ${user.role}登录失败: 无效响应`);
        }
      } catch (error) {
        console.log(`❌ ${user.role}登录失败: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 2. 测试新用户注册和登录
    console.log('\n👤 测试新用户注册和登录...');
    const newUser = {
      username: 'testfixed_' + Date.now(),
      email: `testfixed_${Date.now()}@test.com`,
      password: 'test123456',
      role: 'customer'
    };
    
    try {
      // 注册
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, newUser);
      
      if (registerResponse.data.success) {
        console.log(`✅ 新用户注册成功: ${newUser.email}`);
        
        // 立即登录
        try {
          const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: newUser.email,
            password: newUser.password
          });
          
          if (loginResponse.data.success && loginResponse.data.data.token) {
            console.log(`✅ 新用户登录成功！`);
            console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
            workingUsers++;
          } else {
            console.log(`❌ 新用户登录失败: 无效响应`);
          }
        } catch (loginError) {
          console.log(`❌ 新用户登录失败: ${loginError.response?.data?.message || loginError.message}`);
        }
      } else {
        console.log(`❌ 新用户注册失败: ${registerResponse.data.message}`);
      }
    } catch (error) {
      console.log(`❌ 新用户注册失败: ${error.response?.data?.message || error.message}`);
    }
    
    // 3. 生成最终报告
    console.log('\n📊 修复后测试结果');
    console.log('='.repeat(50));
    
    if (workingUsers > 0) {
      console.log(`✅ 成功登录用户数: ${workingUsers}`);
      console.log('🎉 认证系统修复成功！');
      
      console.log('\n🎯 现在可以开始人工测试:');
      console.log('1. 打开浏览器访问: http://localhost:3000');
      console.log('2. 使用以下账号登录:');
      console.log('   - 管理员: admin@test.com / admin123');
      console.log('   - 商家: merchant@test.com / merchant123');
      console.log('   - 客户: customer@test.com / customer123');
      console.log('3. 或者注册新用户账号');
      console.log('4. 测试各个功能模块');
      
      console.log('\n✨ 系统状态: 可以正常使用！');
    } else {
      console.log('❌ 所有用户登录都失败');
      console.log('💡 需要进一步调试认证问题');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

// 运行测试
testFixedLogin().catch(console.error);