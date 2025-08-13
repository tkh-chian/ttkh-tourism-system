const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动TTKH旅游管理系统...\n');

// 启动后端服务器
console.log('📋 启动后端服务器...');
const backendProcess = spawn('node', ['simple-server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

backendProcess.on('error', (error) => {
  console.error('❌ 后端服务器启动失败:', error);
});

backendProcess.on('close', (code) => {
  console.log(`后端服务器退出，代码: ${code}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭系统...');
  backendProcess.kill();
  process.exit(0);
});

console.log('\n🎉 系统启动完成！');
console.log('\n📍 访问地址:');
console.log('   后端API: http://localhost:3001');
console.log('\n🧪 测试账户:');
console.log('   管理员: admin@ttkh.com / admin123');
console.log('   商家: merchant@test.com / 123456');
console.log('   代理: agent@test.com / 123456');
console.log('   用户: user@test.com / 123456');
console.log('\n🔄 按 Ctrl+C 停止系统');
