const axios = require('axios');
const mysql = require('mysql2/promise');

/**
 * 简化版人工测试自动化
 * 完全模拟人工测试的逻辑和步骤
 */

class SimpleHumanLikeTest {
  constructor() {
    this.testResults = [];
    this.dbConnection = null;
  }

  async initialize() {
    console.log('🚀 初始化测试环境...');
    
    try {
      this.dbConnection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lhjr@170103',
        database: 'ttkh_tourism'
      });
      console.log('✅ 数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return false;
    }
  }

  // 人工测试步骤1: 检查服务状态
  async testServices() {
    console.log('\n🔍 步骤1: 检查服务状态 (模拟人工打开浏览器)');
    
    const services = [
      { name: '前端服务', url: 'http://localhost:3000', expected: 200 },
      { name: '后端API', url: 'http://localhost:3001/api/products', expected: 200 }
    ];

    for (let service of services) {
      try {
        console.log(`   检查 ${service.name}...`);
        const response = await axios.get(service.url, { 
          timeout: 5000,
          validateStatus: () => true // 接受所有状态码
        });
        
        if (response.status === service.expected) {
          console.log(`   ✅ ${service.name}: 正常 (${response.status})`);
          this.testResults.push({ test: service.name, result: 'PASS', details: `状态码: ${response.status}` });
        } else {
          console.log(`   ❌ ${service.name}: 异常 (${response.status})`);
          this.testResults.push({ test: service.name, result: 'FAIL', details: `状态码: ${response.status}` });
        }
      } catch (error) {
        console.log(`   ❌ ${service.name}: 连接失败 - ${error.message}`);
        this.testResults.push({ test: service.name, result: 'FAIL', details: error.message });
      }
    }
  }

  // 人工测试步骤2: 检查数据库用户
  async testDatabaseUsers() {
    console.log('\n🔍 步骤2: 检查数据库用户 (模拟人工查看数据库)');
    
    try {
      const [users] = await this.dbConnection.execute(`
        SELECT email, role, status, username,
               CASE WHEN password IS NULL OR password = '' THEN '未设置' ELSE '已设置' END as password_status
        FROM users 
        WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
        ORDER BY email
      `);

      console.log('   数据库用户状态:');
      users.forEach(user => {
        const status = (user.password_status === '已设置' && user.status === 'active') ? '✅' : '❌';
        console.log(`   ${status} ${user.email}: 角色=${user.role}, 状态=${user.status}, 密码=${user.password_status}, 用户名=${user.username}`);
        
        this.testResults.push({
          test: `用户${user.email}`,
          result: (user.password_status === '已设置' && user.status === 'active') ? 'PASS' : 'FAIL',
          details: `密码=${user.password_status}, 状态=${user.status}`
        });
      });

      if (users.length === 0) {
        console.log('   ❌ 未找到测试用户');
        this.testResults.push({ test: '测试用户存在性', result: 'FAIL', details: '未找到测试用户' });
      }

    } catch (error) {
      console.log(`   ❌ 数据库查询失败: ${error.message}`);
      this.testResults.push({ test: '数据库用户检查', result: 'FAIL', details: error.message });
    }
  }

  // 人工测试步骤3: 模拟登录API调用
  async testLoginAPI() {
    console.log('\n🔍 步骤3: 测试登录API (模拟人工填写表单并提交)');
    
    const testAccounts = [
      { email: 'admin@ttkh.com', password: 'admin123', role: '管理员' },
      { email: 'merchant@test.com', password: '123456', role: '商家' },
      { email: 'agent@test.com', password: '123456', role: '代理' },
      { email: 'user@test.com', password: '123456', role: '用户' }
    ];

    for (let account of testAccounts) {
      console.log(`\n   🧪 测试 ${account.role} 登录 (${account.email})`);
      
      try {
        // 模拟人工填写登录表单并提交
        console.log(`      1. 输入邮箱: ${account.email}`);
        console.log(`      2. 输入密码: ${'*'.repeat(account.password.length)}`);
        console.log(`      3. 点击登录按钮...`);
        
        const response = await axios.post('http://localhost:3001/api/auth/login', {
          email: account.email,
          password: account.password
        }, {
          timeout: 10000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        console.log(`      4. 服务器响应: ${response.status}`);
        
        if (response.status === 200 && response.data.success) {
          console.log(`      ✅ ${account.role} 登录成功`);
          console.log(`         - 获得Token: ${response.data.token ? '是' : '否'}`);
          console.log(`         - 用户信息: ${response.data.data?.user?.email || '未获取'}`);
          
          this.testResults.push({
            test: `${account.role}登录`,
            result: 'PASS',
            details: `成功获取Token和用户信息`
          });
        } else {
          console.log(`      ❌ ${account.role} 登录失败`);
          console.log(`         - 状态码: ${response.status}`);
          console.log(`         - 错误信息: ${response.data?.message || '未知错误'}`);
          
          this.testResults.push({
            test: `${account.role}登录`,
            result: 'FAIL',
            details: `${response.status}: ${response.data?.message || '未知错误'}`
          });
        }

      } catch (error) {
        console.log(`      ❌ ${account.role} 登录异常: ${error.message}`);
        this.testResults.push({
          test: `${account.role}登录`,
          result: 'ERROR',
          details: error.message
        });
      }
    }
  }

  // 人工测试步骤4: 测试前端页面访问
  async testFrontendPages() {
    console.log('\n🔍 步骤4: 测试前端页面访问 (模拟人工浏览页面)');
    
    const pages = [
      { name: '首页', url: 'http://localhost:3000/' },
      { name: '登录页', url: 'http://localhost:3000/login' },
      { name: '注册页', url: 'http://localhost:3000/register' }
    ];

    for (let page of pages) {
      try {
        console.log(`   访问 ${page.name}...`);
        const response = await axios.get(page.url, {
          timeout: 10000,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.status === 200) {
          console.log(`   ✅ ${page.name}: 可访问`);
          this.testResults.push({ test: `${page.name}访问`, result: 'PASS', details: '页面正常加载' });
        } else {
          console.log(`   ❌ ${page.name}: 访问异常 (${response.status})`);
          this.testResults.push({ test: `${page.name}访问`, result: 'FAIL', details: `状态码: ${response.status}` });
        }
      } catch (error) {
        console.log(`   ❌ ${page.name}: 访问失败 - ${error.message}`);
        this.testResults.push({ test: `${page.name}访问`, result: 'FAIL', details: error.message });
      }
    }
  }

  // 生成人工测试报告
  generateReport() {
    console.log('\n📊 生成人工测试报告...');
    console.log('=' * 60);
    
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.result === 'PASS').length,
      failed: this.testResults.filter(r => r.result === 'FAIL').length,
      errors: this.testResults.filter(r => r.result === 'ERROR').length
    };

    console.log(`\n📋 测试摘要:`);
    console.log(`   总测试项: ${summary.total}`);
    console.log(`   ✅ 通过: ${summary.passed}`);
    console.log(`   ❌ 失败: ${summary.failed}`);
    console.log(`   ⚠️  错误: ${summary.errors}`);
    console.log(`   🎯 成功率: ${Math.round((summary.passed / summary.total) * 100)}%`);

    console.log(`\n📝 详细结果:`);
    this.testResults.forEach((result, index) => {
      const status = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${index + 1}. ${status} ${result.test}: ${result.details}`);
    });

    // 问题诊断
    const failedTests = this.testResults.filter(r => r.result !== 'PASS');
    if (failedTests.length > 0) {
      console.log(`\n🔧 问题诊断和修复建议:`);
      failedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.test}:`);
        console.log(`      问题: ${test.details}`);
        
        // 根据测试类型给出具体建议
        if (test.test.includes('登录')) {
          console.log(`      建议: 检查用户密码设置和账户状态`);
        } else if (test.test.includes('服务')) {
          console.log(`      建议: 检查服务是否正常启动`);
        } else if (test.test.includes('用户')) {
          console.log(`      建议: 检查数据库用户数据完整性`);
        }
      });
    }

    return summary;
  }

  async cleanup() {
    if (this.dbConnection) {
      await this.dbConnection.end();
    }
  }

  // 主测试流程
  async runTest() {
    console.log('🎯 开始简化版人工测试自动化');
    console.log('🤖 完全模拟人工测试的逻辑和步骤');
    console.log('=' * 60);
    
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }

      await this.testServices();
      await this.testDatabaseUsers();
      await this.testLoginAPI();
      await this.testFrontendPages();

      const summary = this.generateReport();
      
      console.log('\n🎉 测试完成！');
      
      if (summary.passed === summary.total) {
        console.log('🎊 所有测试通过！系统运行正常！');
        return true;
      } else {
        console.log('⚠️ 发现问题，需要修复');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// 执行测试
async function main() {
  const tester = new SimpleHumanLikeTest();
  const success = await tester.runTest();
  
  if (success) {
    console.log('\n✅ 系统完全正常！可以进行人工测试！');
    console.log('\n🎯 人工测试账户:');
    console.log('   管理员: admin@ttkh.com / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    console.log('\n🌐 访问地址: http://localhost:3000');
  } else {
    console.log('\n❌ 系统存在问题，请根据上述报告进行修复');
  }
}

main().catch(console.error);
