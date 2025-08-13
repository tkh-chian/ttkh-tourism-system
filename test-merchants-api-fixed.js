const axios = require('axios');

// API基础URL
const API_BASE = 'http://localhost:3001';

async function testMerchantsAPI() {
  console.log('🚀 开始测试商家API...\n');
  
  try {
    // 1. 管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    console.log('管理员登录响应:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.data?.token,
      userRole: loginResponse.data.data?.user?.role
    });
    
    const adminToken = loginResponse.data.data?.token;
    if (!adminToken) {
      console.log('❌ 管理员登录失败，无法获取token');
      return;
    }
    
    // 2. 测试获取商家API
    console.log('\n📋 测试获取商家API...');
    try {
      const merchantsResponse = await axios.get(`${API_BASE}/api/admin/merchants`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('获取商家响应原始数据:', merchantsResponse.data);
      
      console.log('获取商家响应结构:', {
        success: merchantsResponse.data.success,
        dataType: typeof merchantsResponse.data.data,
        isArray: Array.isArray(merchantsResponse.data.data),
        count: merchantsResponse.data.data?.length || 0
      });
      
      if (Array.isArray(merchantsResponse.data.data)) {
        console.log('✅ 获取商家API正常工作');
        
        // 显示第一个商家的信息（如果有）
        if (merchantsResponse.data.data.length > 0) {
          const firstMerchant = merchantsResponse.data.data[0];
          console.log('第一个商家信息:', {
            id: firstMerchant.id,
            username: firstMerchant.username,
            role: firstMerchant.role,
            status: firstMerchant.status
          });
        }
      } else {
        console.log('❌ 获取商家API响应格式不正确');
      }
    } catch (error) {
      console.log('❌ 获取商家API错误:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

testMerchantsAPI().catch(console.error);