const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎯 TTKH旅游管理系统 - 完整测试流程');
console.log('=' .repeat(50));

// 测试配置
const config = {
  backend: {
    port: 3001,
    path: path.join(__dirname, 'backend')
  },
  frontend: {
    port: 3000,
    path: path.join(__dirname, 'frontend')
  },
  database: {
    name: 'ttkh_tourism',
    host: 'localhost',
    user: 'root',
    password: ''
  }
};

// 测试步骤
const testSteps = [
  {
    id: 1,
    name: '环境检查',
    description: '检查Node.js、npm和MySQL环境',
    action: checkEnvironment
  },
  {
    id: 2,
    name: '数据库初始化',
    description: '创建数据库表和测试数据',
    action: initDatabase
  },
  {
    id: 3,
    name: '后端服务启动',
    description: '启动Node.js后端API服务器',
    action: startBackend
  },
  {
    id: 4,
    name: '前端服务启动',
    description: '启动React前端开发服务器',
    action: startFrontend
  },
  {
    id: 5,
    name: '功能测试',
    description: '执行核心功能自动化测试',
    action: runFunctionalTests
  }
];

// 全局变量
let backendProcess = null;
let frontendProcess = null;

// 工具函数
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`  执行: ${command}`);
    
    const child = exec(command, {
      cwd: options.cwd || __dirname,
      ...options
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      if (options.showOutput) {
        process.stdout.write(data);
      }
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      if (options.showOutput) {
        process.stderr.write(data);
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ output, errorOutput });
      } else {
        reject(new Error(`命令执行失败 (退出码: ${code})\n${errorOutput}`));
      }
    });
    
    // 超时处理
    if (options.timeout) {
      setTimeout(() => {
        child.kill();
        reject(new Error('命令执行超时'));
      }, options.timeout);
    }
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试步骤实现
async function checkEnvironment() {
  console.log('  🔍 检查Node.js版本...');
  const nodeResult = await runCommand('node --version');
  console.log(`    Node.js: ${nodeResult.output.trim()}`);
  
  console.log('  🔍 检查npm版本...');
  const npmResult = await runCommand('npm --version');
  console.log(`    npm: ${npmResult.output.trim()}`);
  
  console.log('  🔍 检查MySQL连接...');
  try {
    await runCommand('mysql --version', { timeout: 5000 });
    console.log('    MySQL: 可用');
  } catch (error) {
    console.log('    MySQL: 未安装或不可用');
    console.log('    ⚠️  请确保MySQL已安装并运行');
  }
  
  console.log('  ✅ 环境检查完成');
}

async function initDatabase() {
  console.log('  📋 初始化数据库...');
  
  try {
    await runCommand('node init-simple.js', {
      cwd: config.backend.path,
      timeout: 30000
    });
    console.log('  ✅ 数据库初始化成功');
  } catch (error) {
    console.log('  ❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

async function startBackend() {
  console.log('  🚀 启动后端服务器...');
  
  return new Promise((resolve, reject) => {
    backendProcess = spawn('node', ['simple-server.js'], {
      cwd: config.backend.path,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    
    backendProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`    [后端] ${data.toString().trim()}`);
      
      if (output.includes('准备就绪')) {
        console.log('  ✅ 后端服务器启动成功');
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`    [后端错误] ${data.toString().trim()}`);
    });
    
    backendProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`后端服务器异常退出 (代码: ${code})`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!output.includes('准备就绪')) {
        reject(new Error('后端服务器启动超时'));
      }
    }, 15000);
  });
}

async function startFrontend() {
  console.log('  🎨 启动前端服务器...');
  
  // 检查是否已安装依赖
  const packageJsonPath = path.join(config.frontend.path, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('  ⚠️  前端项目未完全初始化，跳过前端启动');
    return;
  }
  
  return new Promise((resolve, reject) => {
    frontendProcess = spawn('npm', ['start'], {
      cwd: config.frontend.path,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let output = '';
    
    frontendProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`    [前端] ${data.toString().trim()}`);
      
      if (output.includes('webpack compiled') || output.includes('Local:')) {
        console.log('  ✅ 前端服务器启动成功');
        resolve();
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      if (!errorMsg.includes('warning') && !errorMsg.includes('deprecated')) {
        console.error(`    [前端错误] ${errorMsg}`);
      }
    });
    
    frontendProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`前端服务器异常退出 (代码: ${code})`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!output.includes('webpack compiled') && !output.includes('Local:')) {
        console.log('  ⚠️  前端服务器启动超时，但继续测试');
        resolve();
      }
    }, 30000);
  });
}

async function runFunctionalTests() {
  console.log('  🧪 执行功能测试...');
  
  const axios = require('axios').default;
  const baseURL = `http://localhost:${config.backend.port}`;
  
  // 测试用例
  const tests = [
    {
      name: '用户注册测试',
      test: async () => {
        const response = await axios.post(`${baseURL}/api/auth/register`, {
          username: '测试商家2',
          email: 'test-merchant@example.com',
          password: '123456',
          role: 'merchant',
          company_name: '测试旅行社',
          contact_person: '测试联系人'
        });
        return response.data.success;
      }
    },
    {
      name: '用户登录测试',
      test: async () => {
        const response = await axios.post(`${baseURL}/api/auth/login`, {
          email: 'merchant@test.com',
          password: '123456'
        });
        return response.data.success && response.data.data.token;
      }
    },
    {
      name: '获取产品列表测试',
      test: async () => {
        const response = await axios.get(`${baseURL}/api/products`);
        return response.data.success;
      }
    },
    {
      name: '管理员审核测试',
      test: async () => {
        // 先登录管理员
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: 'admin@ttkh.com',
          password: 'admin123'
        });
        
        if (!loginResponse.data.success) return false;
        
        const token = loginResponse.data.data.token;
        
        // 获取待审核内容
        const pendingResponse = await axios.get(`${baseURL}/api/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return pendingResponse.data.success;
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`    🔬 ${test.name}...`);
      const result = await test.test();
      if (result) {
        console.log(`      ✅ 通过`);
        passedTests++;
      } else {
        console.log(`      ❌ 失败`);
      }
    } catch (error) {
      console.log(`      ❌ 错误: ${error.message}`);
    }
  }
  
  console.log(`  📊 测试结果: ${passedTests}/${tests.length} 通过`);
  
  if (passedTests === tests.length) {
    console.log('  🎉 所有功能测试通过！');
  } else {
    console.log('  ⚠️  部分测试失败，请检查日志');
  }
}

// 主测试流程
async function runAllTests() {
  console.log(`\n⏰ 开始时间: ${new Date().toLocaleString()}`);
  
  try {
    for (const step of testSteps) {
      console.log(`\n📋 步骤 ${step.id}: ${step.name}`);
      console.log(`📝 ${step.description}`);
      console.log('-'.repeat(40));
      
      await step.action();
      
      // 步骤间延迟
      if (step.id < testSteps.length) {
        await delay(2000);
      }
    }
    
    console.log('\n🎉 所有测试步骤完成！');
    console.log('\n📍 访问地址:');
    console.log(`   前端: http://localhost:${config.frontend.port}`);
    console.log(`   后端: http://localhost:${config.backend.port}`);
    
    console.log('\n🧪 测试账户:');
    console.log('   管理员: admin@ttkh.com / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    
    console.log('\n🔄 服务器将继续运行，按 Ctrl+C 停止');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    cleanup();
    process.exit(1);
  }
}

// 清理函数
function cleanup() {
  console.log('\n🧹 清理资源...');
  
  if (backendProcess) {
    backendProcess.kill();
    console.log('  ✅ 后端服务器已停止');
  }
  
  if (frontendProcess) {
    frontendProcess.kill();
    console.log('  ✅ 前端服务器已停止');
  }
}

// 信号处理
process.on('SIGINT', () => {
  console.log('\n\n🛑 收到停止信号...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 收到终止信号...');
  cleanup();
  process.exit(0);
});

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    cleanup();
    process.exit(1);
  });
}

module.exports = { runAllTests, cleanup };