const axios = require('axios');

console.log('🔧 TTKH旅游系统测试用户初始化');
console.log('='.repeat(50));

// 配置
const BASE_URL = 'http://localhost:3001';

// 管理员账户信息
const ADMIN_ACCOUNT = {
  email: 'admin@ttkh.com',
  password: 'admin123'
};

// 测试用户信息
const TEST_USERS = [
  {
    username: '测试商家',
    email: 'merchant@test.com',
    password: '123456',
    role: 'merchant',
    company_name: '测试旅行社',
    contact_person: '商家联系人'
  },
  {
    username: '测试代理',
    email: 'agent@test.com',
    password: '123456',
    role: 'agent'
  },
  {
    username: '测试用户',
    email: 'user@test.com',
    password: '123456',
    role: 'customer'
  }
];

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 管理员登录
async function adminLogin() {
  try {
    console.log('\n🔐 管理员登录...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_ACCOUNT.email,
      password: ADMIN_ACCOUNT.password
    });
    
    if (response.data.success) {
      console.log('   ✅ 管理员登录成功');
      return response.data.data.token;
    } else {
      console.log(`   ❌ 管理员登录失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 管理员登录异常: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 创建测试用户
async function createTestUser(adminToken, userData) {
  try {
    console.log(`\n👥 创建${userData.role}用户...`);
    
    // 注册用户
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    
    if (registerResponse.data.success) {
      console.log(`   ✅ ${userData.role}用户注册成功`);
      const userId = registerResponse.data.data.userId;
      
      // 审核通过用户
      const approveResponse = await axios.put(
        `${BASE_URL}/api/admin/users/${userId}/review`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (approveResponse.data.success) {
        console.log(`   ✅ ${userData.role}用户审核通过`);
        return true;
      } else {
        console.log(`   ❌ ${userData.role}用户审核失败: ${approveResponse.data.message}`);
        return false;
      }
    } else {
      console.log(`   ❌ ${userData.role}用户注册失败: ${registerResponse.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${userData.role}用户创建异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主执行流程
async function main() {
  console.log('开始初始化测试用户...\n');
  
  // 等待服务启动
  console.log('⏳ 等待服务完全启动(30秒)...');
  await delay(30000);
  
  // 管理员登录
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('\n❌ 管理员登录失败，无法继续创建测试用户');
    return;
  }
  
  // 创建测试用户
  for (const user of TEST_USERS) {
    await createTestUser(adminToken, user);
  }
  
  console.log('\n🎉 测试用户初始化完成！');
  console.log('\n📋 测试账户信息:');
  console.log('   管理员: admin@ttkh.com / admin123');
  console.log('   商家: merchant@test.com / 123456');
  console.log('   代理: agent@test.com / 123456');
  console.log('   用户: user@test.com / 123456');
  
  console.log('\n🌐 请访问以下地址进行测试:');
  console.log('   前端界面: http://localhost:3000');
  console.log('   后端接口: http://localhost:3001');
}

// 执行主流程
main().catch(error => {
  console.error('初始化过程中出现未预期的错误:', error.message);
});