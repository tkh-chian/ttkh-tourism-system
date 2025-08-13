const axios = require('axios');

async function debugProductCreation() {
  console.log('🔍 调试产品创建500错误...\n');
  
  try {
    // 1. 先登录获取token
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
    console.log('✅ 登录成功，获取token');
    
    // 2. 测试产品创建API
    console.log('\n=== 2. 测试产品创建 ===');
    
    const productData = {
      title_zh: '测试产品中文标题',
      title_th: 'ผลิตภัณฑ์ทดสอบ',
      description_zh: '这是一个测试产品的中文描述',
      description_th: 'นี่คือคำอธิบายผลิตภัณฑ์ทดสอบ',
      base_price: 1500,
      poster_image: '',
      poster_filename: '',
      pdf_file: '',
      pdf_filename: ''
    };
    
    console.log('发送产品数据:', JSON.stringify(productData, null, 2));
    
    const createResponse = await axios.post('http://localhost:3001/api/products', productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ 产品创建成功!');
      console.log('产品信息:', createResponse.data.data);
    }
    
  } catch (error) {
    console.log('❌ 错误详情:');
    console.log('状态码:', error.response?.status);
    console.log('错误消息:', error.response?.data?.message);
    console.log('完整错误:', error.response?.data);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 500错误通常是服务器内部错误，可能原因:');
      console.log('1. 数据库字段不匹配');
      console.log('2. 必填字段缺失');
      console.log('3. 数据类型错误');
      console.log('4. 外键约束问题');
    }
  }
}

debugProductCreation();