const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔄 自动重启TTKH旅游系统...');

async function killAllNodeProcesses() {
  return new Promise((resolve) => {
    console.log('🛑 停止所有Node进程...');
    exec('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"', (error) => {
      if (error) {
        console.log('⚠️  没有找到运行中的Node进程');
      } else {
        console.log('✅ 所有Node进程已停止');
      }
      resolve();
    });
  });
}

async function waitForSeconds(seconds) {
  console.log(`⏳ 等待 ${seconds} 秒...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🚀 启动后端服务器...');
    
    const backend = spawn('node', ['simple-server-fixed.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe'
    });

    let started = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('后端:', output.trim());
      
      if (output.includes('准备就绪，等待前端连接') && !started) {
        started = true;
        console.log('✅ 后端服务器启动成功！');
        resolve(backend);
      }
    });

    backend.stderr.on('data', (data) => {
      console.error('后端错误:', data.toString());
    });

    backend.on('error', (error) => {
      console.error('❌ 后端启动失败:', error);
      reject(error);
    });

    // 超时检查
    setTimeout(() => {
      if (!started) {
        console.log('⚠️  后端启动超时，但继续执行...');
        resolve(backend);
      }
    }, 10000);
  });
}

async function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🎨 启动前端应用...');
    
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true
    });

    let started = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('前端:', output.trim());
      
      if (output.includes('webpack compiled successfully') && !started) {
        started = true;
        console.log('✅ 前端应用启动成功！');
        resolve(frontend);
      }
    });

    frontend.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning')) {
        console.error('前端错误:', error);
      }
    });

    frontend.on('error', (error) => {
      console.error('❌ 前端启动失败:', error);
      reject(error);
    });

    // 超时检查
    setTimeout(() => {
      if (!started) {
        console.log('⚠️  前端启动超时，但继续执行...');
        resolve(frontend);
      }
    }, 15000);
  });
}

async function testConnections() {
  console.log('🔍 测试系统连接...');
  
  return new Promise((resolve) => {
    exec('node simple-api-test.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ API测试失败:', error.message);
      } else {
        console.log('✅ API测试结果:');
        console.log(stdout);
      }
      resolve();
    });
  });
}

async function main() {
  try {
    // 1. 停止所有进程
    await killAllNodeProcesses();
    await waitForSeconds(2);
    
    // 2. 启动后端
    const backendProcess = await startBackend();
    await waitForSeconds(3);
    
    // 3. 启动前端
    const frontendProcess = await startFrontend();
    await waitForSeconds(5);
    
    // 4. 测试连接
    await testConnections();
    
    console.log('\n🎉 系统重启完成！');
    console.log('📍 前端地址: http://localhost:3000');
    console.log('📍 后端地址: http://localhost:3001');
    console.log('📍 IE错误监控: http://localhost:3003');
    
    console.log('\n✅ 系统已准备就绪，可以开始验证！');
    
    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n🛑 正在关闭系统...');
      if (backendProcess) backendProcess.kill();
      if (frontendProcess) frontendProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ 系统重启失败:', error);
    process.exit(1);
  }
}

main();