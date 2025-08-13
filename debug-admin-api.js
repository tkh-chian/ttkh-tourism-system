const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function debugAdminAPI() {
  try {
    console.log('🔍 调试管理员API...');
    
    // 管理员登录
    console.log('1. 管理员登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 测试管理员产品API
    console.log('\n2. 测试管理员产品API...');
    try {
      const response = await axios.get(`${BASE_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ API调用成功');
      console.log('📊 响应状态:', response.status);
      console.log('📋 响应数据结构:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ API调用失败:', error.response?.data || error.message);
      console.log('📊 错误状态:', error.response?.status);
    }
    
    // 测试带状态参数的API
    console.log('\n3. 测试带状态参数的API...');
    try {
      const response = await axios.get(`${BASE_URL}/admin/products?status=pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ 带参数API调用成功');
      console.log('📊 响应状态:', response.status);
      console.log('📋 响应数据结构:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ 带参数API调用失败:', error.response?.data || error.message);
      console.log('📊 错误状态:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugAdminAPI();