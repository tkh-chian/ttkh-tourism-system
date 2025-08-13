const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. 自动化终端日志检查
function captureTerminalOutput(command, callback) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令时出错: ${error}`);
      return callback(error);
    }
    console.log('终端输出:', stdout);
    console.error('终端错误输出:', stderr);
    callback(null, stdout, stderr);
  });
}

// 2. 自动化数据库连接检查
function checkDatabaseConnection() {
  const dbConfigPath = path.join(__dirname, 'backend', 'config', 'database.js');
  const dbConfigCode = fs.readFileSync(dbConfigPath, 'utf-8');
  const testConnectionFunction = dbConfigCode.match(/const\s+testConnection\s*=\s*async\s*=>\s*\{([\s\S]*?)\}\s*;/);

  if (!testConnectionFunction) {
    console.error('未找到 testConnection 函数');
    return;
  }

  const testConnectionCode = `(${testConnectionFunction[0]})()`;
  eval(testConnectionCode).then(success => {
    if (success) {
      console.log('数据库连接成功');
    } else {
      console.error('数据库连接失败');
    }
  }).catch(error => {
    console.error('数据库连接检查时出错:', error);
  });
}

// 3. 自动化后端服务启动检查
function checkBackendService() {
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  captureTerminalOutput(`node "${serverPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('后端服务启动失败:', error);
    } else {
      console.log('后端服务启动成功');
    }
  });
}

// 4. 自动化前端服务启动检查
function checkFrontendService() {
  const frontendPath = path.join(__dirname, 'frontend');
  process.chdir(frontendPath);
  captureTerminalOutput('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error('前端服务启动失败:', error);
    } else {
      console.log('前端服务启动成功');
    }
  });
}

// 5. 自动化资源占用检查
function checkSystemResources() {
  // 这里可以使用操作系统提供的工具或第三方库来监控系统资源
  console.log('系统资源占用检查（暂未实现）');
}

// 6. 自动化代码生成检查
function checkCodeGenerationStrategy() {
  // 这里可以根据具体的代码生成逻辑来实现
  console.log('代码生成策略检查（暂未实现）');
}

// 主函数：执行所有检查
function main() {
  console.log('开始自动化排查...');

  // 1. 终端日志检查
  captureTerminalOutput(`node "${path.join(__dirname, 'backend', 'server.js')}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('终端日志检查发现错误:', error);
    } else {
      console.log('终端日志检查完成');
    }

    // 2. 数据库连接检查
    checkDatabaseConnection();

    // 3. 后端服务启动检查
    checkBackendService();

    // 4. 前端服务启动检查
    checkFrontendService();

    // 5. 系统资源占用检查
    checkSystemResources();

    // 6. 代码生成策略检查
    checkCodeGenerationStrategy();
  });
}

main();