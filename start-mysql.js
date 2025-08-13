console.log('🚀 启动TTKH旅游系统 - MySQL版本\n');

// 检查MySQL配置
const { spawn } = require('child_process');
const path = require('path');

console.log('📋 启动步骤:');
console.log('1. 配置MySQL连接信息');
console.log('2. 启动后端服务器');
console.log('3. 运行功能测试\n');

console.log('🔧 首次使用请先配置MySQL:');
console.log('node setup-mysql.js\n');

console.log('💡 如果MySQL已配置，直接启动服务器:');
console.log('cd backend && node mysql-server.js\n');

console.log('🧪 启动后可运行测试:');
console.log('node mysql-test.js\n');

// 尝试启动MySQL服务器
console.log('⏳ 尝试启动MySQL服务器...');

const serverProcess = spawn('node', ['mysql-server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

serverProcess.on('error', (error) => {
  console.error('\n❌ 服务器启动失败:', error.message);
  console.log('\n🔧 解决方案:');
  console.log('1. 确保MySQL服务正在运行');
  console.log('2. 运行配置向导: node setup-mysql.js');
  console.log('3. 检查MySQL用户名和密码');
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`\n❌ 服务器退出，代码: ${code}`);
    console.log('\n🔧 常见问题解决:');
    console.log('1. MySQL连接被拒绝 - 检查用户名密码');
    console.log('2. 数据库不存在 - 系统会自动创建');
    console.log('3. 端口被占用 - 修改端口配置');
  }
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});