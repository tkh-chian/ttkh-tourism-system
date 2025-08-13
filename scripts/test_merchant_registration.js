const axios = require('axios');

(async function main() {
  try {
    const BASE = 'http://localhost:3001';
    
    // 1. 注册一个新商家
    const merchant = {
      username: 'test_merchant_' + Date.now(),
      email: 'test_merchant_' + Date.now() + '@test.com',
      password: '123456',
      role: 'merchant',
      company_name: 'Test Travel Agency',
      contact_person: 'Test Contact Person'
    };
    
    console.log('正在注册商家:', merchant.email);
    
    let registerResponse;
    try {
      registerResponse = await axios.post(BASE + '/api/auth/register', merchant);
      console.log('注册响应:', JSON.stringify(registerResponse.data, null, 2));
      
      // 检查注册的用户状态
      if (registerResponse.data && registerResponse.data.data && registerResponse.data.data.user) {
        console.log('新注册商家状态:', registerResponse.data.data.user.status);
        if (registerResponse.data.data.user.status !== 'pending') {
          console.error('错误: 商家状态应为 pending，但实际为:', registerResponse.data.data.user.status);
        } else {
          console.log('✅ 商家状态正确设置为 pending');
        }
      }
    } catch (e) {
      console.log('注册请求失败:', e.message);
      if (e.response) {
        console.log('服务器响应:', JSON.stringify(e.response.data, null, 2));
      }
      process.exit(1);
    }

    // 2. 登录管理员
    console.log('\n正在登录管理员...');
    let adminToken;
    try {
      const loginResponse = await axios.post(BASE + '/api/auth/login', { 
        email: 'admin@ttkh.com', 
        password: 'admin123' 
      });
      adminToken = loginResponse.data.data.token;
      console.log('管理员登录成功，获取到令牌');
    } catch (e) {
      console.error('管理员登录失败:', e.message);
      if (e.response) {
        console.log('服务器响应:', JSON.stringify(e.response.data, null, 2));
      }
      process.exit(1);
    }

    // 3. 获取待审核用户列表
    console.log('\n正在获取待审核用户列表...');
    try {
      const pendingResponse = await axios.get(BASE + '/api/admin/users?status=pending', {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      
      const pendingUsers = pendingResponse.data.data.users || [];
      console.log('待审核用户数量:', pendingUsers.length);
      
      // 检查是否找到了我们刚注册的商家
      const foundUser = pendingUsers.find(user => user.email === merchant.email);
      if (foundUser) {
        console.log('✅ 成功在待审核列表中找到新注册的商家');
        console.log('用户详情:', JSON.stringify(foundUser, null, 2));
      } else {
        console.error('❌ 在待审核列表中未找到新注册的商家');
        console.log('待审核用户列表:', JSON.stringify(pendingUsers, null, 2));
      }
    } catch (e) {
      console.error('获取待审核用户列表失败:', e.message);
      if (e.response) {
        console.log('服务器响应:', JSON.stringify(e.response.data, null, 2));
      }
    }

    console.log('\n测试完成');
  } catch (err) {
    console.error('测试过程中发生错误:', err);
    process.exit(1);
  }
})();