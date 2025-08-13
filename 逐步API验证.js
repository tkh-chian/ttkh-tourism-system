const axios = require('axios');

// API基础URL
const API_BASE = 'http://localhost:3001';

async function stepByStepTest() {
  console.log('🚀 开始逐步API验证...\n');
  
  try {
    // 1. 测试管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const adminLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    console.log('管理员登录响应:', {
      success: adminLoginResponse.data.success,
      hasToken: !!adminLoginResponse.data.data?.token,
      userRole: adminLoginResponse.data.data?.user?.role
    });
    
    const adminToken = adminLoginResponse.data.data?.token;
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
      
      console.log('获取商家响应:', {
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
    
    // 3. 测试商家注册
    console.log('\n🏪 测试商家注册...');
    const testMerchant = {
      username: `测试商家_${Date.now()}`,
      email: `merchant_${Date.now()}@test.com`,
      password: 'merchant123',
      role: 'merchant',
      company_name: '测试旅游公司',
      contact_person: '张三'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testMerchant);
      
      console.log('商家注册响应:', {
        success: registerResponse.data.success,
        message: registerResponse.data.message,
        hasData: !!registerResponse.data.data,
        hasUser: !!registerResponse.data.data?.user,
        userId: registerResponse.data.data?.user?.id
      });
      
      if (registerResponse.data.success && registerResponse.data.data?.user?.id) {
        console.log('✅ 商家注册API正常工作');
        const merchantId = registerResponse.data.data.user.id;
        
        // 4. 测试商家审核
        console.log('\n✅ 测试商家审核...');
        try {
          const approveResponse = await axios.put(`${API_BASE}/api/admin/merchants/${merchantId}/approve`, {
            status: 'approved'
          }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          
          console.log('商家审核响应:', {
            success: approveResponse.data.success,
            message: approveResponse.data.message
          });
          
          if (approveResponse.data.success) {
            console.log('✅ 商家审核API正常工作');
          } else {
            console.log('❌ 商家审核API响应格式不正确');
          }
        } catch (error) {
          console.log('❌ 商家审核API错误:', error.response?.data || error.message);
        }
      } else {
        console.log('❌ 商家注册API响应格式不正确');
      }
    } catch (error) {
      console.log('❌ 商家注册API错误:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 逐步API验证完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

stepByStepTest().catch(console.error);