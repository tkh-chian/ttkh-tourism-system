const axios = require('axios');

async function debug404Error() {
  console.log('🔍 调试404错误...\n');
  
  try {
    // 1. 测试管理员登录
    console.log('1️⃣ 测试管理员登录...');
    const adminLogin = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (adminLogin.data.token) {
      console.log('✅ 管理员登录成功');
      const adminToken = adminLogin.data.token;
      
      // 2. 测试获取管理员资料
      console.log('\n2️⃣ 测试获取管理员资料...');
      try {
        const adminProfile = await axios.get('http://localhost:3001/api/auth/profile', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ 获取管理员资料成功:', adminProfile.data);
      } catch (error) {
        console.log('❌ 获取管理员资料失败:', error.response?.status, error.response?.data || error.message);
        
        // 尝试使用 /me 路由
        console.log('\n3️⃣ 尝试使用 /api/auth/me 路由...');
        try {
          const adminMe = await axios.get('http://localhost:3001/api/auth/me', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          console.log('✅ 使用 /me 路由成功:', adminMe.data);
        } catch (meError) {
          console.log('❌ /me 路由也失败:', meError.response?.status, meError.response?.data || meError.message);
        }
      }
      
      // 4. 测试管理员API
      console.log('\n4️⃣ 测试管理员API...');
      const adminApis = [
        { name: '获取用户列表', url: '/api/admin/users' },
        { name: '获取产品列表', url: '/api/admin/products' },
        { name: '获取订单列表', url: '/api/admin/orders' },
        { name: '获取统计数据', url: '/api/admin/statistics' }
      ];
      
      for (const api of adminApis) {
        try {
          const response = await axios.get(`http://localhost:3001${api.url}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          console.log(`✅ ${api.name}: 成功`);
        } catch (error) {
          console.log(`❌ ${api.name}: 失败 (${error.response?.status}) ${error.response?.data?.error || error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message);
  }
}

debug404Error();