const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 TTKH旅游系统 - MySQL配置向导\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupMySQL() {
  try {
    console.log('请提供MySQL连接信息：\n');
    
    const host = await askQuestion('MySQL主机地址 (默认: localhost): ') || 'localhost';
    const port = await askQuestion('MySQL端口 (默认: 3306): ') || '3306';
    const user = await askQuestion('MySQL用户名 (默认: root): ') || 'root';
    const password = await askQuestion('MySQL密码 (如无密码请直接回车): ');
    
    console.log('\n📝 配置信息确认:');
    console.log(`主机: ${host}`);
    console.log(`端口: ${port}`);
    console.log(`用户: ${user}`);
    console.log(`密码: ${password ? '***' : '(无密码)'}`);
    
    const confirm = await askQuestion('\n确认配置? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 配置已取消');
      process.exit(0);
    }
    
    // 更新配置文件
    const configPath = path.join(__dirname, 'backend', 'mysql-config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    configContent = configContent.replace(/host: 'localhost'/, `host: '${host}'`);
    configContent = configContent.replace(/user: 'root'/, `user: '${user}'`);
    configContent = configContent.replace(/password: ''/, `password: '${password}'`);
    
    if (port !== '3306') {
      configContent = configContent.replace(/host: '${host}',/, `host: '${host}',\n  port: ${port},`);
    }
    
    fs.writeFileSync(configPath, configContent);
    
    console.log('\n✅ MySQL配置已更新');
    console.log('\n🚀 现在可以启动系统了:');
    console.log('cd ttkh-tourism-system/backend && node mysql-server.js');
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
  } finally {
    rl.close();
  }
}

setupMySQL();