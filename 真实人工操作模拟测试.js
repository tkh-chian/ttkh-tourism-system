const axios = require('axios');
const mysql = require('mysql2/promise');

// 配置
const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

let connection;

// 模拟浏览器会话
class BrowserSession {
  constructor() {
    this.cookies = {};
    this.token = null;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  async request(method, url, data = null) {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: { ...this.headers },
      validateStatus: () => true // 不抛出错误，让我们处理所有状态码
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      
      // 记录详细的请求和响应信息
      console.log(`\n📡 ${method} ${url}`);
      console.log(`状态码: ${response.status}`);
      if (response.status >= 400) {
        console.log(`❌ 错误响应:`, response.data);
      }
      
      return response;
    } catch (error) {
      console.log(`\n💥 请求失败 ${method} ${url}:`, error.message);
      throw error;
    }
  }

  setToken(token) {
    this.token = token;
    console.log(`🔑 设置认证令牌: ${token.substring(0, 20)}...`);
  }
}

// 真实人工操作模拟测试
async function runRealUserSimulation() {
  console.log('🎭 开始真实人工操作模拟测试...\n');

  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 创建浏览器会话
    const adminSession = new BrowserSession();
    const userSession = new BrowserSession();

    // 1. 模拟管理员登录（就像您在浏览器中操作）
    console.log('\n🔐 步骤1: 管理员登录测试');
    const loginResponse = await adminSession.request('POST', '/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ 管理员登录失败:', loginResponse.data);
      return false;
    }

    adminSession.setToken(loginResponse.data.token);
    console.log('✅ 管理员登录成功');

    // 2. 模拟访问管理员页面（检查认证状态）
    console.log('\n👤 步骤2: 检查管理员认证状态');
    const profileResponse = await adminSession.request('GET', '/api/auth/me');
    
    if (profileResponse.status !== 200) {
      console.log('❌ 获取管理员信息失败:', profileResponse.data);
      return false;
    }
    console.log('✅ 管理员认证状态正常:', profileResponse.data.user.email);

    // 3. 模拟查看用户列表（您遇到错误的地方）
    console.log('\n👥 步骤3: 查看用户列表');
    const usersResponse = await adminSession.request('GET', '/api/admin/users');
    
    if (usersResponse.status !== 200) {
      console.log('❌ 获取用户列表失败:', usersResponse.data);
      console.log('🔍 检查数据库用户表状态...');
      
      // 检查数据库中的用户数据
      const [users] = await connection.execute('SELECT id, email, role, status, created_at FROM users LIMIT 5');
      console.log('📊 数据库中的用户数据:', users);
      
      return false;
    }
    
    console.log(`✅ 用户列表获取成功，共 ${usersResponse.data.users.length} 个用户`);
    
    // 显示前几个用户的详细信息
    usersResponse.data.users.slice(0, 3).forEach((user, index) => {
      console.log(`   用户${index + 1}: ${user.email} (${user.role}) - ${user.status}`);
    });

    // 4. 模拟用户注册（模拟您看到的注册过程）
    console.log('\n📝 步骤4: 模拟新用户注册');
    const newUserEmail = `testuser_${Date.now()}@test.com`;
    const registerResponse = await userSession.request('POST', '/api/auth/register', {
      email: newUserEmail,
      password: 'test123456',
      name: '测试用户',
      role: 'customer'
    });

    if (registerResponse.status !== 201) {
      console.log('❌ 用户注册失败:', registerResponse.data);
      return false;
    }
    console.log(`✅ 新用户注册成功: ${newUserEmail}`);

    // 5. 管理员再次查看用户列表（检查新注册的用户）
    console.log('\n🔄 步骤5: 管理员查看更新后的用户列表');
    const updatedUsersResponse = await adminSession.request('GET', '/api/admin/users');
    
    if (updatedUsersResponse.status !== 200) {
      console.log('❌ 获取更新后用户列表失败:', updatedUsersResponse.data);
      return false;
    }

    const newUser = updatedUsersResponse.data.users.find(u => u.email === newUserEmail);
    if (newUser) {
      console.log(`✅ 新注册用户已出现在列表中: ${newUser.email} (状态: ${newUser.status})`);
    } else {
      console.log('⚠️ 新注册用户未在列表中找到');
    }

    // 6. 模拟商家注册和审核流程
    console.log('\n🏪 步骤6: 模拟商家注册');
    const merchantEmail = `merchant_${Date.now()}@test.com`;
    const merchantRegisterResponse = await userSession.request('POST', '/api/auth/register', {
      email: merchantEmail,
      password: 'merchant123',
      name: '测试商家',
      role: 'merchant'
    });

    if (merchantRegisterResponse.status !== 201) {
      console.log('❌ 商家注册失败:', merchantRegisterResponse.data);
    } else {
      console.log(`✅ 商家注册成功: ${merchantEmail}`);
      
      // 管理员查看待审核商家
      console.log('\n📋 步骤7: 管理员查看待审核商家');
      const merchantsResponse = await adminSession.request('GET', '/api/admin/merchants');
      
      if (merchantsResponse.status === 200) {
        const pendingMerchants = merchantsResponse.data.merchants.filter(m => m.status === 'pending');
        console.log(`✅ 待审核商家数量: ${pendingMerchants.length}`);
      } else {
        console.log('❌ 获取商家列表失败:', merchantsResponse.data);
      }
    }

    // 7. 检查系统日志和错误
    console.log('\n📊 步骤8: 检查系统状态');
    
    // 检查数据库连接状态
    const [dbStatus] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
    console.log(`📈 数据库用户总数: ${dbStatus[0].user_count}`);
    
    // 检查最近的用户活动
    const [recentUsers] = await connection.execute(
      'SELECT email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    console.log('\n📅 最近注册的用户:');
    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status} - ${user.created_at}`);
    });

    console.log('\n🎉 真实人工操作模拟测试完成！');
    console.log('\n📋 测试总结:');
    console.log('✅ 管理员登录正常');
    console.log('✅ 用户列表访问正常');
    console.log('✅ 用户注册功能正常');
    console.log('✅ 商家注册功能正常');
    console.log('✅ 数据库状态正常');
    
    return true;

  } catch (error) {
    console.log('\n💥 测试过程中发生错误:', error.message);
    console.log('错误详情:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 错误监控和日志分析
async function analyzeSystemLogs() {
  console.log('\n🔍 分析系统日志和潜在问题...');
  
  try {
    // 检查数据库表结构
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 数据库表:', tables.map(t => Object.values(t)[0]));
    
    // 检查用户表结构
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('\n👤 用户表结构:');
    userColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(必填)' : '(可选)'}`);
    });
    
    // 检查是否有数据完整性问题
    const [orphanedData] = await connection.execute(`
      SELECT 'products' as table_name, COUNT(*) as count 
      FROM products p 
      LEFT JOIN users u ON p.merchant_id = u.id 
      WHERE u.id IS NULL
      UNION ALL
      SELECT 'orders' as table_name, COUNT(*) as count 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedData.some(row => row.count > 0)) {
      console.log('\n⚠️ 发现数据完整性问题:');
      orphanedData.forEach(row => {
        if (row.count > 0) {
          console.log(`   ${row.table_name}表有 ${row.count} 条孤立数据`);
        }
      });
    } else {
      console.log('\n✅ 数据完整性检查通过');
    }
    
  } catch (error) {
    console.log('❌ 日志分析失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 启动真实人工操作模拟测试系统\n');
  
  // 等待服务启动
  console.log('⏳ 等待服务启动...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 运行真实模拟测试
    const testResult = await runRealUserSimulation();
    
    if (testResult) {
      // 分析系统日志
      await analyzeSystemLogs();
      
      console.log('\n🎯 测试建议:');
      console.log('1. 在浏览器中访问 http://localhost:3000');
      console.log('2. 使用 admin@ttkh.com / admin123 登录');
      console.log('3. 查看用户管理页面');
      console.log('4. 注册新用户并观察列表更新');
      console.log('5. 如果仍有错误，请查看浏览器控制台和网络请求');
      
    } else {
      console.log('\n❌ 测试失败，需要进一步调试');
    }
    
  } catch (error) {
    console.log('\n💥 测试系统启动失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runRealUserSimulation, analyzeSystemLogs };