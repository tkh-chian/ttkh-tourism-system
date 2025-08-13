const axios = require('axios');

async function testUserStatusAPI() {
  console.log('🔧 测试用户状态更新API...\n');
  
  try {
    // 1. 获取管理员token
    console.log('👨‍💼 获取管理员token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.token) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 2. 获取商家列表，找到一个测试用户
    console.log('\n📋 获取商家列表...');
    const merchantsResponse = await axios.get('http://localhost:3001/api/admin/merchants', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (!merchantsResponse.data.success || !merchantsResponse.data.data.users.length) {
      console.log('❌ 没有找到商家用户');
      return;
    }
    
    const testUser = merchantsResponse.data.data.users[0];
    console.log('✅ 找到测试用户:', {
      id: testUser.id,
      username: testUser.username,
      currentStatus: testUser.status
    });
    
    // 3. 测试更新用户状态 - PUT方法
    console.log('\n🔄 测试PUT方法更新用户状态...');
    try {
      const putResponse = await axios.put(`http://localhost:3001/api/admin/users/${testUser.id}/status`, {
        status: 'approved'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (putResponse.data.success) {
        console.log('✅ PUT方法更新成功:', putResponse.data.message);
      }
    } catch (putError) {
      console.log('❌ PUT方法失败:', putError.response?.status, putError.response?.data?.message);
    }
    
    // 4. 测试更新用户状态 - PATCH方法
    console.log('\n🔄 测试PATCH方法更新用户状态...');
    try {
      const patchResponse = await axios.patch(`http://localhost:3001/api/admin/users/${testUser.id}/status`, {
        status: 'suspended'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (patchResponse.data.success) {
        console.log('✅ PATCH方法更新成功:', patchResponse.data.message);
      }
    } catch (patchError) {
      console.log('❌ PATCH方法失败:', patchError.response?.status, patchError.response?.data?.message);
    }
    
    // 5. 验证状态是否更新成功
    console.log('\n🔍 验证状态更新结果...');
    const verifyResponse = await axios.get('http://localhost:3001/api/admin/merchants', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const updatedUser = verifyResponse.data.data.users.find(u => u.id === testUser.id);
    if (updatedUser) {
      console.log('✅ 用户状态验证:', {
        id: updatedUser.id,
        username: updatedUser.username,
        oldStatus: testUser.status,
        newStatus: updatedUser.status
      });
    }
    
    console.log('\n🎯 API测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

testUserStatusAPI().catch(console.error);