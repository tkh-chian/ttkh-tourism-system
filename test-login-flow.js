const axios = require('axios');

// 测试配置
const API_BASE = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3001';

// 测试账户
const TEST_ACCOUNTS = [
  {
    email: 'admin@ttkh.com',
    password: 'admin123',
    role: 'admin',
    name: '管理员测试'
  }
];

async function testLoginFlow() {
  console.log('🚀 开始端对端登录流程测试...\n');

  for (const account of TEST_ACCOUNTS) {
    console.log(`📝 测试账户: ${account.email} (${account.role})`);
    
    try {
      // 1. 测试后端登录API
      console.log('  ⏳ 测试后端登录API...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: account.email,
        password: account.password
      });

      if (loginResponse.data && loginResponse.data.user && loginResponse.data.token) {
        console.log('  ✅ 后端登录成功');
        console.log(`     用户: ${loginResponse.data.user.name || loginResponse.data.user.email}`);
        console.log(`     角色: ${loginResponse.data.user.role}`);
        console.log(`     Token: ${loginResponse.data.token.substring(0, 20)}...`);
        
        // 2. 测试Token验证
        console.log('  ⏳ 测试Token验证...');
        const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        
        if (profileResponse.data && profileResponse.data.user) {
          console.log('  ✅ Token验证成功');
          console.log(`     验证用户: ${profileResponse.data.user.name || profileResponse.data.user.email}`);
        } else {
          console.log('  ❌ Token验证失败');
        }
        
      } else {
        console.log('  ❌ 后端登录失败 - 响应格式错误');
        console.log('     响应:', loginResponse.data);
      }
      
    } catch (error) {
      console.log('  ❌ 登录测试失败');
      if (error.response) {
        console.log(`     状态码: ${error.response.status}`);
        console.log(`     错误信息: ${error.response.data?.message || error.response.data}`);
      } else {
        console.log(`     网络错误: ${error.message}`);
      }
    }
    
    console.log(''); // 空行分隔
  }

  // 3. 前端访问测试
  console.log('🌐 前端访问测试:');
  console.log(`   登录页面: ${FRONTEND_URL}/login`);
  console.log(`   主页: ${FRONTEND_URL}/`);
  console.log('');

  // 4. 测试步骤说明
  console.log('📋 手动测试步骤:');
  console.log('1. 打开浏览器访问: http://localhost:3001');
  console.log('2. 如果未登录，会自动跳转到登录页面');
  console.log('3. 使用测试账户登录:');
  console.log('   - 邮箱: admin@ttkh.com');
  console.log('   - 密码: admin123');
  console.log('4. 登录成功后应该跳转到首页');
  console.log('5. 检查页面右上角是否显示用户信息');
  console.log('');

  console.log('✅ 端对端测试完成！');
}

// 运行测试
testLoginFlow().catch(console.error);