const axios = require('axios');

async function testAdminLogin() {
  console.log('🔧 测试管理员登录修复...\n');

  try {
    // 测试不同的登录方式
    const loginAttempts = [
      { username: 'admin', password: 'admin123' },
      { email: 'admin@ttkh.com', password: 'admin123' },
      { username: 'admin@ttkh.com', password: 'admin123' }
    ];

    for (let i = 0; i < loginAttempts.length; i++) {
      const attempt = loginAttempts[i];
      console.log(`🔄 尝试登录方式 ${i + 1}:`, attempt);

      try {
        const response = await axios.post('http://localhost:3001/api/auth/login', attempt);
        
        if (response.data.success) {
          console.log('✅ 登录成功!');
          console.log('👤 用户信息:', {
            id: response.data.data.user.id,
            username: response.data.data.user.username,
            email: response.data.data.user.email,
            role: response.data.data.user.role
          });
          console.log('🔑 Token获取成功');
          return response.data.data.token;
        }
      } catch (error) {
        console.log(`❌ 登录方式 ${i + 1} 失败:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n❌ 所有登录方式都失败了');
    return null;

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
    return null;
  }
}

testAdminLogin();