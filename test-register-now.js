const axios = require('axios');

async function testRegisterNow() {
  console.log('🧪 测试修复后的注册功能...\n');
  
  try {
    // 测试注册新用户
    const testUser = {
      username: '新注册测试用户',
      email: `test${Date.now()}@example.com`,
      password: 'test123456',
      role: 'merchant',
      company_name: '测试公司',
      contact_person: '测试联系人',
      phone: '13800138000'
    };
    
    console.log('📝 注册数据:', testUser);
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testUser);
    
    console.log('✅ 注册成功!');
    console.log('📄 响应:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ 注册失败:', error.response?.data || error.message);
    return false;
  }
}

testRegisterNow();