const axios = require('axios');

async function testLoginFix() {
  console.log('🔧 测试登录修复...\n');
  
  try {
    // 测试管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    console.log('📊 登录响应结构:');
    console.log('- success:', response.data.success);
    console.log('- message:', response.data.message);
    console.log('- data存在:', !!response.data.data);
    
    if (response.data.data) {
      console.log('- user存在:', !!response.data.data.user);
      console.log('- token存在:', !!response.data.data.token);
      console.log('- 用户角色:', response.data.data.user?.role);
    }
    
    if (response.data.success && response.data.data && response.data.data.user && response.data.data.token) {
      console.log('✅ 登录API响应格式正确');
      
      // 生成前端可用的localStorage设置命令
      const token = response.data.data.token;
      const user = JSON.stringify(response.data.data.user);
      
      console.log('\n🎯 前端localStorage设置命令:');
      console.log(`localStorage.setItem('token', '${token}');`);
      console.log(`localStorage.setItem('user', '${user}');`);
      
      return true;
    } else {
      console.log('❌ 登录API响应格式异常');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 登录测试失败:', error.response?.data || error.message);
    return false;
  }
}

testLoginFix().then(success => {
  if (success) {
    console.log('\n🎉 登录修复成功！现在可以在前端正常登录了。');
    console.log('\n📋 下一步操作:');
    console.log('1. 在浏览器中访问 http://localhost:3000/login');
    console.log('2. 使用管理员账户登录: admin@ttkh.com / admin123');
    console.log('3. 登录成功后应该能正常跳转到首页');
  } else {
    console.log('\n❌ 登录修复失败，需要进一步检查。');
  }
}).catch(console.error);