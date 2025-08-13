const mysql = require('mysql2/promise');
const axios = require('axios');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

const API_BASE = 'http://localhost:3001';

async function quickTest() {
  console.log('🚀 开始快速验证测试...\n');
  
  let adminToken = null;
  
  try {
    // 1. 管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      adminToken = loginResponse.data.data.token;
      console.log('✅ 管理员登录成功');
    } else {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    // 2. 测试获取商家API
    console.log('\n📋 测试获取商家API...');
    const merchantsResponse = await axios.get(`${API_BASE}/api/admin/merchants`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('API响应结构:', {
      success: merchantsResponse.data.success,
      hasData: !!merchantsResponse.data.data,
      dataType: typeof merchantsResponse.data.data,
      isArray: Array.isArray(merchantsResponse.data.data),
      dataLength: merchantsResponse.data.data ? merchantsResponse.data.data.length : 0
    });
    
    if (merchantsResponse.data.success && Array.isArray(merchantsResponse.data.data)) {
      console.log('✅ 获取商家API修复成功');
      const pendingMerchants = merchantsResponse.data.data.filter(m => m.status === 'pending');
      console.log(`找到 ${pendingMerchants.length} 个待审核商家`);
    } else {
      console.log('❌ 获取商家API仍有问题');
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
    
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testMerchant);
    
    console.log('注册响应结构:', {
      success: registerResponse.data.success,
      hasData: !!registerResponse.data.data,
      hasUser: !!(registerResponse.data.data && registerResponse.data.data.user),
      userId: registerResponse.data.data && registerResponse.data.data.user ? registerResponse.data.data.user.id : null
    });
    
    if (registerResponse.data.success && registerResponse.data.data && registerResponse.data.data.user && registerResponse.data.data.user.id) {
      console.log('✅ 商家注册API修复成功');
      console.log(`新商家ID: ${registerResponse.data.data.user.id}`);
      
      // 4. 测试商家审核
      console.log('\n✅ 测试商家审核...');
      const approveResponse = await axios.put(`${API_BASE}/api/admin/merchants/${registerResponse.data.data.user.id}/approve`, {
        status: 'approved'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (approveResponse.data.success) {
        console.log('✅ 商家审核功能正常');
      } else {
        console.log('❌ 商家审核功能有问题');
      }
    } else {
      console.log('❌ 商家注册API仍有问题');
    }
    
    console.log('\n🎉 快速验证测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

quickTest().catch(console.error);