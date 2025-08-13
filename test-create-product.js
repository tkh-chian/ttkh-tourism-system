const axios = require('axios');

async function testCreateProduct() {
  try {
    // 先登录获取token
    console.log('🔐 正在登录商家账户...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'merchant@ttkh.com',
      password: 'merchant123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 商家登录成功');
    
    // 测试创建产品
    console.log('📦 正在创建测试产品...');
    const productData = {
      title_zh: '测试产品',
      title_th: 'ผลิตภัณฑ์ทดสอบ',
      description_zh: '这是一个测试产品',
      description_th: 'นี่คือผลิตภัณฑ์ทดสอบ',
      base_price: 1000,
      category_id: 1
    };
    
    const createResponse = await axios.post('http://localhost:3001/api/products', productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 产品创建成功:', createResponse.data);
    
    // 验证产品是否真的创建了
    console.log('🔍 验证产品创建...');
    const productsResponse = await axios.get('http://localhost:3001/api/products/merchant/my-products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📋 商家产品列表:', productsResponse.data.data.products.length, '个产品');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateProduct();