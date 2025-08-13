const { exec } = require('child_process');
const path = require('path');

console.log('🚀 开始测试TTKH旅游管理系统...\n');

// 测试步骤
const testSteps = [
  {
    name: '1. 初始化数据库',
    command: 'cd backend && node scripts/init-db.js',
    description: '创建数据库表和初始数据'
  },
  {
    name: '2. 启动后端服务器',
    command: 'cd backend && npm start',
    description: '启动Node.js后端服务器',
    background: true
  },
  {
    name: '3. 启动前端开发服务器',
    command: 'cd frontend && npm start',
    description: '启动React前端开发服务器',
    background: true
  }
];

async function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`执行命令: ${command}`);
    
    const child = exec(command, { 
      cwd: path.join(__dirname),
      ...options 
    });
    
    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    if (options.background) {
      setTimeout(() => resolve(), 3000); // 后台任务等待3秒
    }
  });
}

async function runTests() {
  try {
    for (const step of testSteps) {
      console.log(`\n📋 ${step.name}`);
      console.log(`📝 ${step.description}`);
      console.log('─'.repeat(50));
      
      await runCommand(step.command, { background: step.background });
      
      if (!step.background) {
        console.log('✅ 完成\n');
      } else {
        console.log('🔄 后台运行中...\n');
      }
    }
    
    console.log('🎉 系统启动完成！');
    console.log('\n📍 访问地址:');
    console.log('   前端: http://localhost:3000');
    console.log('   后端: http://localhost:3001');
    console.log('\n🧪 测试账户:');
    console.log('   管理员: admin / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();