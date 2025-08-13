const axios = require('axios');

async function fixMerchantAuth() {
  console.log('🔧 修复商家认证401错误...\n');
  
  try {
    // 1. 商家登录获取token
    console.log('=== 1. 商家登录 ===');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'testmerchant@test.com',
      password: 'merchant123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败');
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ 登录成功');
    console.log('用户ID:', user.id);
    console.log('用户角色:', user.role);
    console.log('Token前20位:', token.substring(0, 20) + '...');
    
    // 2. 测试不同的API端点
    console.log('\n=== 2. 测试API端点 ===');
    
    const endpoints = [
      { method: 'GET', url: '/api/products', desc: '获取产品列表' },
      { method: 'GET', url: '/api/products/merchant/my-products', desc: '获取商家产品' },
      { method: 'POST', url: '/api/products', desc: '创建产品', data: {
        title_zh: '测试产品',
        title_th: 'ผลิตภัณฑ์ทดสอบ',
        base_price: 1000
      }}
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n测试: ${endpoint.desc}`);
        console.log(`请求: ${endpoint.method} ${endpoint.url}`);
        
        const config = {
          method: endpoint.method.toLowerCase(),
          url: `http://localhost:3001${endpoint.url}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        if (endpoint.data) {
          config.data = endpoint.data;
        }
        
        const response = await axios(config);
        console.log('✅ 成功:', response.status);
        
        if (endpoint.url.includes('my-products')) {
          console.log('产品数量:', response.data.data?.products?.length || 0);
        }
        
      } catch (error) {
        console.log('❌ 失败:', error.response?.status, error.response?.data?.message);
        
        if (error.response?.status === 401) {
          console.log('🔍 401错误详情:');
          console.log('- 错误消息:', error.response.data?.message);
          console.log('- 请求头:', error.config?.headers?.Authorization?.substring(0, 30) + '...');
        }
      }
    }
    
    // 3. 验证token解析
    console.log('\n=== 3. 验证Token解析 ===');
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('Token内容:', decoded);
      
      // 验证token是否有效
      const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token验证成功');
      
    } catch (jwtError) {
      console.log('❌ Token验证失败:', jwtError.message);
    }
    
  } catch (error) {
    console.log('❌ 修复过程出错:', error.message);
  }
}

fixMerchantAuth();