const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 启动 TTKH 旅游系统...\n');

// 杀死占用端口的进程
const killPort = (port) => {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const pids = [];
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[parts.length - 1];
            if (pid && !pids.includes(pid)) {
              pids.push(pid);
            }
          }
        });
        
        if (pids.length > 0) {
          console.log(`🔧 正在终止占用端口 ${port} 的进程: ${pids.join(', ')}`);
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, () => {});
          });
        }
      }
      setTimeout(resolve, 1000);
    });
  });
};

// 启动后端服务
const startBackend = () => {
  console.log('\n🔧 启动后端服务...');
  const backendPath = path.join(__dirname, 'backend');
  
  const backend = spawn('node', ['server.js'], {
    cwd: backendPath,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backend.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('启动') || output.includes('listening') || output.includes('数据库')) {
      console.log(`[后端] ${output}`);
    }
  });

  backend.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && (output.includes('Error') || output.includes('错误'))) {
      console.error(`[后端错误] ${output}`);
    }
  });

  backend.on('error', (error) => {
    console.error('❌ 后端启动失败:', error.message);
  });

  return backend;
};

// 启动前端服务
const startFrontend = () => {
  console.log('\n🎨 启动前端服务...');
  const frontendPath = path.join(__dirname, 'frontend');
  
  const frontend = spawn('npm', ['start'], {
    cwd: frontendPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Compiled') || output.includes('Local') || output.includes('webpack')) {
      console.log(`[前端] ${output}`);
    }
  });

  frontend.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && (output.includes('Error') || output.includes('错误'))) {
      console.error(`[前端错误] ${output}`);
    }
  });

  frontend.on('error', (error) => {
    console.error('❌ 前端启动失败:', error.message);
  });

  return frontend;
};

// 主启动流程
async function startSystem() {
  try {
    console.log('1. 清理端口占用...');
    await killPort(3000);
    await killPort(3001);
    
    console.log('2. 启动服务...');
    const backendProcess = startBackend();
    // 等待后端启动后再启动前端
    setTimeout(() => {
      const frontendProcess = startFrontend();
    }, 3000);
    
    console.log('\n✅ 系统启动命令已执行！');
    console.log('\n📋 访问信息:');
    console.log('   前端: http://localhost:3000');
    console.log('   后端: http://localhost:3001');
    console.log('\n🧪 测试账户:');
    console.log('   管理员: admin@ttkh.com / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    
    // 保持进程运行
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
  }
}

// 启动系统
startSystem();