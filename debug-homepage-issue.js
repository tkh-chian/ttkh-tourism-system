const axios = require('axios');

async function debugHomepageIssue() {
  console.log('🔍 调试首页产品显示问题...\n');
  
  try {
    // 1. 测试产品API
    console.log('1. 测试产品API...');
    const response = await axios.get('http://localhost:3001/api/products?status=approved');
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    // 2. 测试不带参数的API
    console.log('\n2. 测试不带参数的产品API...');
    const response2 = await axios.get('http://localhost:3001/api/products');
    console.log('API响应状态:', response2.status);
    console.log('API响应数据:', JSON.stringify(response2.data, null, 2));
    
    // 3. 测试公开API
    console.log('\n3. 测试公开产品API...');
    const response3 = await axios.get('http://localhost:3001/api/products/public');
    console.log('API响应状态:', response3.status);
    console.log('API响应数据:', JSON.stringify(response3.data, null, 2));
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

debugHomepageIssue();