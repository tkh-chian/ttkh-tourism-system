const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 TTKH旅游系统全自动启动程序');
console.log('='.repeat(50));

// 检查并清理端口占用
function checkAndKillPorts() {
  return new Promise((resolve) => {
    console.log('\n🔍 检查端口占用情况...');
    
    // 检查3000端口
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
      
      // 检查3001端口
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
        
        setTimeout(() => {
          console.log('✅ 端口检查和清理完成');
          resolve();
        }, 2000);
      });
    });
  });
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
    
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      detached: true,
      stdio: 'ignore'
    });
    
    frontend.unref();
    console.log('   🌐 前端服务已在端口 3000 启动');
    resolve();
  });
}

// 主执行流程
async function main() {
  try {
    // 1. 检查并清理端口
    await checkAndKillPorts();
    
    // 2. 启动后端服务
    await startBackend();
    
    // 3. 启动前端服务
    await startFrontend();
    
    // 4. 输出访问信息
    console.log('\n🎉 系统启动完成！');
    console.log('\n📋 访问地址:');
    console.log('   前端界面: http://localhost:3000');
    console.log('   后端接口: http://localhost:3001');
    
    console.log('\n🔐 测试账户:');
    console.log('   管理员: admin@ttkh.com / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    
    console.log('\n⏱️  请等待约30秒服务完全启动后再访问');
    
  } catch (error) {
    console.error('❌ 启动过程中出现错误:', error.message);
  }
}

// 执行主流程
main();