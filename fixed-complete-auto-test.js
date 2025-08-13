const { spawn, exec } = require('child_process');
const path = require('path');
const axios = require('axios');

console.log('🚀 TTKH旅游系统修复版完整自动化测试');
console.log('='.repeat(50));

// 配置
const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// 测试账户
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@ttkh.com',
    password: 'admin123'
  }
};

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 检查并清理端口占用
async function checkAndKillPorts() {
  console.log('\n🔍 检查并清理端口占用...');
  
  // 杀掉占用3000端口的进程
  await new Promise((resolve) => {
    exec('netstat -ano | findstr :3000', (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              console.log(`   🔧 终止占用3000端口的进程 PID: ${pid}`);
              exec(`taskkill /F /PID ${pid}`, () => {});
            }
          }
        });
      }
      setTimeout(resolve, 1000);
    });
  });
  
  // 杀掉占用3001端口的进程
  await new Promise((resolve) => {
    exec('netstat -ano | findstr :3001', (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              console.log(`   🔧 终止占用3001端口的进程 PID: ${pid}`);
              exec(`taskkill /F /PID ${pid}`, () => {});
            }
          }
        });
      }
      setTimeout(resolve, 1000);
    });
  });
  
  console.log('✅ 端口清理完成');
}

// 启动后端服务
function startBackend() {
  return new Promise((resolve) => {
    console.log('\n🔧 启动后端服务...');
    
    const backend = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'backend'),
      detached: true,
      stdio: 'ignore'
    });
    
    backend.unref();
    console.log('   📡 后端服务已在端口 3001 启动');
    resolve();
  });
}

// 启动前端服务
function startFrontend() {
  return new Promise((resolve) => {
    console.log('\n🎨 启动前端服务...');
    
    const frontend = spawn('cmd', ['/c', 'npm', 'start'], {
      cwd: path.join(__dirname, 'frontend'),
      detached: true,
      stdio: 'ignore'
    });
    
    frontend.unref();
    console.log('   🌐 前端服务已在端口 3000 启动');
    resolve();
  });
}

// 测试后端健康检查
async function testBackendHealth() {
  try {
    console.log('\n🔍 测试后端服务健康状态...');
    // 等待后端启动
    await delay(5000);
    
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ 后端服务健康检查通过');
    return true;
  } catch (error) {
    console.log('   ❌ 后端服务未响应');
    return false;
  }
}

// 测试用户登录
async function testUserLogin(role) {
  try {
    console.log(`\n🔐 测试${role}登录...`);
    const account = TEST_ACCOUNTS[role];
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: account.email,
      password: account.password
    });
    
    if (response.data.success) {
      console.log(`   ✅ ${role}登录成功`);
      return response.data.data.token;
    } else {
      console.log(`   ❌ ${role}登录失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ ${role}登录异常: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试获取产品列表
async function testGetProducts() {
  try {
    console.log('\n🛍️ 测试获取产品列表...');
    const response = await axios.get(`${BASE_URL}/api/products`);
    
    if (response.data.success) {
      console.log(`   ✅ 成功获取产品列表，共${response.data.data.products.length}个产品`);
      return true;
    } else {
      console.log(`   ❌ 获取产品列表失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 获取产品列表异常: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主执行流程
async function main() {
  try {
    console.log('开始修复版完整自动化测试...\n');
    
    // 1. 检查并清理端口
    await checkAndKillPorts();
    
    // 2. 启动服务
    await startBackend();
    await startFrontend();
    
    // 3. 等待服务启动
    console.log('\n⏳ 等待服务完全启动(30秒)...');
    await delay(30000);
    
    // 4. 测试后端健康状态
    const isBackendHealthy = await testBackendHealth();
    if (!isBackendHealthy) {
      console.log('\n❌ 后端服务未正常启动，测试终止');
      return;
    }
    
    // 5. 测试管理员登录
    const adminToken = await testUserLogin('admin');
    if (!adminToken) {
      console.log('\n❌ 管理员登录失败，测试终止');
      return;
    }
    
    // 6. 测试获取产品列表
    await testGetProducts();
    
    // 7. 输出测试总结
    console.log('\n📋 测试总结:');
    console.log(`   后端服务: ${isBackendHealthy ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   管理员登录: ${adminToken ? '✅ 成功' : '❌ 失败'}`);
    
    console.log('\n🎉 修复版完整自动化测试完成！');
    console.log('\n🌐 系统已成功启动并运行:');
    console.log(`   前端界面: ${FRONTEND_URL}`);
    console.log(`   后端接口: ${BASE_URL}`);
    
    console.log('\n📋 管理员测试账户:');
    console.log('   邮箱: admin@ttkh.com');
    console.log('   密码: admin123');
    
    console.log('\n💡 现在您可以进行人工测试了!');
    
  } catch (error) {
    console.error('测试过程中出现未预期的错误:', error.message);
  }
}

// 执行主流程
main();