const puppeteer = require('puppeteer');
const axios = require('axios');
const mysql = require('mysql2/promise');

/**
 * 人工测试自动化 - 99%模拟真实用户操作
 * 这个脚本将完全模拟人类的操作方式，包括：
 * 1. 真实浏览器操作
 * 2. 真实的点击、输入、等待
 * 3. 真实的网络请求监控
 * 4. 真实的错误捕获
 */

class HumanLikeTestAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.dbConnection = null;
    this.testResults = [];
    this.errors = [];
  }

  // 初始化测试环境
  async initialize() {
    console.log('🚀 初始化人工测试自动化环境...');
    
    try {
      // 启动真实浏览器
      this.browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口，完全模拟人工操作
        slowMo: 100,     // 减慢操作速度，模拟人类操作
        devtools: true,  // 打开开发者工具
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 设置视窗大小，模拟真实用户
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // 监听所有网络请求，完全模拟浏览器行为
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        console.log(`📡 网络请求: ${request.method()} ${request.url()}`);
        request.continue();
      });

      // 监听响应
      this.page.on('response', (response) => {
        if (response.status() >= 400) {
          console.log(`❌ 网络错误: ${response.status()} ${response.url()}`);
          this.errors.push({
            type: 'network',
            status: response.status(),
            url: response.url(),
            timestamp: new Date()
          });
        }
      });

      // 监听控制台错误
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.log(`🚨 浏览器错误: ${msg.text()}`);
          this.errors.push({
            type: 'console',
            message: msg.text(),
            timestamp: new Date()
          });
        }
      });

      // 连接数据库
      this.dbConnection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lhjr@170103',
        database: 'ttkh_tourism'
      });

      console.log('✅ 测试环境初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      return false;
    }
  }

  // 人工操作：等待元素出现
  async waitForElementLikeHuman(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      // 模拟人类识别元素的时间
      await this.page.waitForTimeout(Math.random() * 500 + 200);
      return true;
    } catch (error) {
      console.log(`⏰ 等待元素超时: ${selector}`);
      return false;
    }
  }

  // 人工操作：输入文本
  async typeTextLikeHuman(selector, text) {
    try {
      await this.page.click(selector);
      await this.page.waitForTimeout(100);
      
      // 清空输入框
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      
      // 模拟人类打字速度
      for (let char of text) {
        await this.page.keyboard.type(char);
        await this.page.waitForTimeout(Math.random() * 100 + 50);
      }
      
      return true;
    } catch (error) {
      console.log(`❌ 输入文本失败: ${selector} - ${error.message}`);
      return false;
    }
  }

  // 人工操作：点击按钮
  async clickLikeHuman(selector) {
    try {
      await this.page.hover(selector);
      await this.page.waitForTimeout(200);
      await this.page.click(selector);
      await this.page.waitForTimeout(500);
      return true;
    } catch (error) {
      console.log(`❌ 点击失败: ${selector} - ${error.message}`);
      return false;
    }
  }

  // 测试1: 检查系统服务状态
  async testSystemServices() {
    console.log('\n🔍 测试1: 检查系统服务状态');
    
    const services = [
      { name: '前端服务', url: 'http://localhost:3000' },
      { name: '后端服务', url: 'http://localhost:3001/api/products' }
    ];

    for (let service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        console.log(`✅ ${service.name}: 正常 (${response.status})`);
        this.testResults.push({
          test: `${service.name}状态检查`,
          result: 'PASS',
          details: `状态码: ${response.status}`
        });
      } catch (error) {
        console.log(`❌ ${service.name}: 异常 - ${error.message}`);
        this.testResults.push({
          test: `${service.name}状态检查`,
          result: 'FAIL',
          details: error.message
        });
      }
    }
  }

  // 测试2: 数据库用户状态检查
  async testDatabaseUsers() {
    console.log('\n🔍 测试2: 检查数据库用户状态');
    
    try {
      const [users] = await this.dbConnection.execute(`
        SELECT email, role, status, 
               CASE WHEN password IS NULL OR password = '' THEN '未设置' ELSE '已设置' END as password_status
        FROM users 
        WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
      `);

      console.log('数据库用户状态:');
      users.forEach(user => {
        console.log(`- ${user.email}: 角色=${user.role}, 状态=${user.status}, 密码=${user.password_status}`);
        
        if (user.password_status === '未设置' || user.status !== 'active') {
          this.testResults.push({
            test: `用户${user.email}状态检查`,
            result: 'FAIL',
            details: `密码=${user.password_status}, 状态=${user.status}`
          });
        } else {
          this.testResults.push({
            test: `用户${user.email}状态检查`,
            result: 'PASS',
            details: `密码=${user.password_status}, 状态=${user.status}`
          });
        }
      });
    } catch (error) {
      console.log(`❌ 数据库检查失败: ${error.message}`);
      this.testResults.push({
        test: '数据库用户状态检查',
        result: 'FAIL',
        details: error.message
      });
    }
  }

  // 测试3: 真实浏览器登录测试
  async testRealBrowserLogin() {
    console.log('\n🔍 测试3: 真实浏览器登录测试');
    
    const testAccounts = [
      { email: 'admin@ttkh.com', password: 'admin123', role: '管理员' },
      { email: 'merchant@test.com', password: '123456', role: '商家' },
      { email: 'agent@test.com', password: '123456', role: '代理' },
      { email: 'user@test.com', password: '123456', role: '用户' }
    ];

    for (let account of testAccounts) {
      console.log(`\n🧪 测试登录: ${account.role} (${account.email})`);
      
      try {
        // 1. 访问登录页面
        console.log('1. 访问登录页面...');
        await this.page.goto('http://localhost:3000/login', { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });

        // 2. 等待页面加载
        const loginFormExists = await this.waitForElementLikeHuman('form');
        if (!loginFormExists) {
          throw new Error('登录表单未找到');
        }

        // 3. 输入邮箱
        console.log('2. 输入邮箱...');
        const emailInput = await this.waitForElementLikeHuman('input[name="email"]');
        if (!emailInput) {
          throw new Error('邮箱输入框未找到');
        }
        await this.typeTextLikeHuman('input[name="email"]', account.email);

        // 4. 输入密码
        console.log('3. 输入密码...');
        const passwordInput = await this.waitForElementLikeHuman('input[name="password"]');
        if (!passwordInput) {
          throw new Error('密码输入框未找到');
        }
        await this.typeTextLikeHuman('input[name="password"]', account.password);

        // 5. 点击登录按钮
        console.log('4. 点击登录按钮...');
        const loginButton = await this.waitForElementLikeHuman('button[type="submit"]');
        if (!loginButton) {
          throw new Error('登录按钮未找到');
        }

        // 清空之前的错误
        this.errors = [];
        
        await this.clickLikeHuman('button[type="submit"]');

        // 6. 等待登录结果
        console.log('5. 等待登录结果...');
        await this.page.waitForTimeout(3000);

        // 7. 检查登录结果
        const currentUrl = this.page.url();
        console.log(`当前URL: ${currentUrl}`);

        if (currentUrl.includes('/login')) {
          // 仍在登录页面，检查错误信息
          const errorElements = await this.page.$$('.bg-red-50, .text-red-600, [class*="error"]');
          let errorMessage = '未知错误';
          
          if (errorElements.length > 0) {
            errorMessage = await this.page.evaluate(el => el.textContent, errorElements[0]);
          }

          // 检查网络错误
          const networkErrors = this.errors.filter(e => e.type === 'network');
          if (networkErrors.length > 0) {
            errorMessage += ` | 网络错误: ${networkErrors[0].status}`;
          }

          console.log(`❌ ${account.role}登录失败: ${errorMessage}`);
          this.testResults.push({
            test: `${account.role}登录测试`,
            result: 'FAIL',
            details: errorMessage
          });
        } else {
          console.log(`✅ ${account.role}登录成功`);
          this.testResults.push({
            test: `${account.role}登录测试`,
            result: 'PASS',
            details: `成功跳转到: ${currentUrl}`
          });
        }

      } catch (error) {
        console.log(`❌ ${account.role}登录测试异常: ${error.message}`);
        this.testResults.push({
          test: `${account.role}登录测试`,
          result: 'ERROR',
          details: error.message
        });
      }

      // 每次测试后等待
      await this.page.waitForTimeout(1000);
    }
  }

  // 生成详细测试报告
  async generateReport() {
    console.log('\n📊 生成测试报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.result === 'PASS').length,
        failed: this.testResults.filter(r => r.result === 'FAIL').length,
        errors: this.testResults.filter(r => r.result === 'ERROR').length
      },
      details: this.testResults,
      errors: this.errors
    };

    console.log('\n📋 测试摘要:');
    console.log(`总测试数: ${report.summary.total}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`错误: ${report.summary.errors}`);

    console.log('\n📝 详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
    });

    if (this.errors.length > 0) {
      console.log('\n🚨 捕获的错误:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message || error.status}`);
      });
    }

    return report;
  }

  // 清理资源
  async cleanup() {
    console.log('\n🧹 清理测试环境...');
    
    if (this.dbConnection) {
      await this.dbConnection.end();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ 清理完成');
  }

  // 主测试流程
  async runFullTest() {
    console.log('🎯 开始人工测试自动化 - 99%模拟真实用户操作');
    console.log('=' * 60);
    
    try {
      // 初始化
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('初始化失败');
      }

      // 执行测试
      await this.testSystemServices();
      await this.testDatabaseUsers();
      await this.testRealBrowserLogin();

      // 生成报告
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// 执行测试
async function main() {
  const tester = new HumanLikeTestAutomation();
  const report = await tester.runFullTest();
  
  if (report) {
    console.log('\n🎉 测试完成！');
    console.log(`成功率: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`);
    
    if (report.summary.failed > 0 || report.summary.errors > 0) {
      console.log('\n💡 建议修复以下问题:');
      report.details
        .filter(r => r.result !== 'PASS')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.test}: ${result.details}`);
        });
    }
  }
}

// 检查依赖
async function checkDependencies() {
  try {
    require('puppeteer');
    console.log('✅ Puppeteer 已安装');
    return true;
  } catch (error) {
    console.log('❌ 缺少 Puppeteer 依赖');
    console.log('请运行: npm install puppeteer');
    return false;
  }
}

// 启动测试
checkDependencies().then(hasDepends => {
  if (hasDepends) {
    main();
  }
});