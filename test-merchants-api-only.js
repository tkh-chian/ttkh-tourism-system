const axios = require('axios');

async function testMerchantsAPI() {
  try {
    console.log('🧪 测试商家API修复效果...');
    
    // 1. 先登录获取token
    console.log('🔐 1. 登录管理员账号...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    console.log('📊 登录响应:', loginResponse.data);
    
    if (!loginResponse.data.success && !loginResponse.data.token) {
      throw new Error('登录失败: ' + (loginResponse.data.message || '未知错误'));
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 2. 测试商家API
    console.log('🏪 2. 测试商家API...');
    const merchantsResponse = await axios.get('http://localhost:3001/api/admin/merchants', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 API响应状态:', merchantsResponse.status);
    console.log('📊 API响应数据结构:', {
      success: merchantsResponse.data.success,
      hasData: !!merchantsResponse.data.data,
      hasUsers: !!merchantsResponse.data.data?.users,
      userCount: merchantsResponse.data.data?.users?.length || 0,
      pagination: merchantsResponse.data.pagination
    });
    
    // 3. 验证数据格式
    const data = merchantsResponse.data;
    if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
      console.log('✅ 数据格式正确！');
      console.log('📈 商家数量:', data.data.users.length);
      
      if (data.data.users.length > 0) {
        console.log('👤 第一个商家信息:', {
          id: data.data.users[0].id,
          username: data.data.users[0].username,
          role: data.data.users[0].role,
          status: data.data.users[0].status,
          company_name: data.data.users[0].company_name
        });
      }
      
      // 统计各状态商家数量
      const statusCount = data.data.users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 商家状态统计:', statusCount);
      console.log('🎉 商家管理API修复成功！');
      
    } else {
      console.log('❌ 数据格式错误:', data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testMerchantsAPI();