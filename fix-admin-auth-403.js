const axios = require('axios');

// API基础URL
const API_BASE = 'http://localhost:3001';

async function fixAdminAuth() {
  console.log('🔧 修复管理员认证问题...\n');
  
  try {
    // 1. 测试管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      const adminToken = loginResponse.data.data.token;
      console.log('✅ 管理员登录成功');
      console.log('🔑 管理员Token:', adminToken);
      
      // 2. 测试使用token访问商家API
      console.log('\n📋 测试使用token访问商家API...');
      const merchantsResponse = await axios.get(`${API_BASE}/api/admin/merchants`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (merchantsResponse.data.success) {
        console.log('✅ 使用token访问商家API成功');
        console.log('📊 商家数量:', merchantsResponse.data.data?.users?.length || 0);
        
        // 3. 生成前端可用的token信息
        console.log('\n🎯 前端认证修复指南:');
        console.log('请在浏览器控制台中执行以下命令:');
        console.log(`localStorage.setItem('token', '${adminToken}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify(loginResponse.data.data.user)}');`);
        console.log('然后刷新页面即可正常访问商家管理页面。');
        
        return adminToken;
      } else {
        console.log('❌ 使用token访问商家API失败');
      }
    } else {
      console.log('❌ 管理员登录失败');
    }
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.response?.data || error.message);
  }
}

fixAdminAuth().catch(console.error);