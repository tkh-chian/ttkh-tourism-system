const axios = require('axios');

async function testMerchantAuth() {
  try {
    console.log('🔧 修复商家认证问题测试');
    
    // 1. 商家登录获取正确token
    console.log('\n=== 1. 商家登录 ===');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'merchant',
      password: 'merchant123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 商家登录成功');
      const token = loginResponse.data.data.token;
      console.log('🔑 Token:', token.substring(0, 50) + '...');
      
      // 2. 测试获取商家产品
      console.log('\n=== 2. 测试商家产品API ===');
      const productsResponse = await axios.get('http://localhost:3001/api/products/merchant/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (productsResponse.data.success) {
        console.log('✅ 商家产品API调用成功');
        console.log('📦 产品数量:', productsResponse.data.data.products.length);
      }
      
    } else {
      console.log('❌ 商家登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testMerchantAuth();