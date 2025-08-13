const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// 配置信息
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

// 前端和后端目录
const frontendDir = path.join(__dirname, 'frontend');
const backendDir = path.join(__dirname, 'backend');

// 端口配置
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 打印彩色消息
function printColored(message, color) {
  console.log(`${color}${message}${colors.reset}`);
}

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const netstat = exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        resolve(false); // 端口未被占用
      } else {
        resolve(true); // 端口被占用
      }
    });
  });
}

// 杀死占用端口的进程
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, async (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
          const pid = parts[4];
          if (pid && !isNaN(parseInt(pid))) {
            printColored(`正在结束占用端口 ${port} 的进程 (PID: ${pid})...`, colors.yellow);
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (err) {
                printColored(`无法结束进程 ${pid}: ${err.message}`, colors.red);
              } else {
                printColored(`成功结束进程 ${pid}`, colors.green);
              }
              resolve(true);
            });
          }
        }
      }
    });
  });
}

// 检查数据库连接
async function checkDatabase() {
  printColored('正在检查数据库连接...', colors.cyan);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    printColored('✅ 数据库连接成功', colors.green);
    
    // 检查价格日历表
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        travel_date,
        DATE_FORMAT(travel_date, '%Y-%m-%d') as formatted_date,
        price,
        available_stock
      FROM price_schedules 
      LIMIT 5
    `);
    
    printColored(`找到 ${schedules.length} 个价格日历记录:`, colors.green);
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. 日期: ${schedule.formatted_date}, 价格: ${schedule.price}, 库存: ${schedule.available_stock}`);
    });
    
    // 检查用户表
    const [users] = await connection.execute(`
      SELECT id, name, email, role FROM users LIMIT 5
    `);
    
    printColored(`找到 ${users.length} 个用户:`, colors.green);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || user.email} (${user.role})`);
    });
    
    await connection.end();
    return true;
  } catch (error) {
    printColored(`❌ 数据库连接失败: ${error.message}`, colors.red);
    return false;
  }
}

// 启动后端服务器
async function startBackend() {
  printColored('正在启动后端服务器...', colors.cyan);
  
  // 检查端口是否被占用
  const isPortBusy = await checkPort(BACKEND_PORT);
  if (isPortBusy) {
    printColored(`端口 ${BACKEND_PORT} 已被占用，正在尝试释放...`, colors.yellow);
    await killProcessOnPort(BACKEND_PORT);
    // 等待端口释放
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 启动后端服务器
  const backend = spawn('node', ['simple-server-fixed.js'], {
    cwd: backendDir,
    shell: true,
    stdio: 'pipe'
  });
  
  backend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.cyan}[后端] ${data}${colors.reset}`);
  });
  
  backend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[后端错误] ${data}${colors.reset}`);
  });
  
  // 等待后端启动
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 检查后端是否成功启动
  try {
    const http = require('http');
    const checkBackend = () => {
      return new Promise((resolve) => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
        
        req.on('error', () => {
          resolve(false);
        });
        
        req.end();
      });
    };
    
    let attempts = 0;
    let backendRunning = false;
    
    while (attempts < 5 && !backendRunning) {
      backendRunning = await checkBackend();
      if (!backendRunning) {
        printColored(`等待后端启动，尝试 ${attempts + 1}/5...`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      attempts++;
    }
    
    if (backendRunning) {
      printColored(`✅ 后端服务器已成功启动，运行在端口 ${BACKEND_PORT}`, colors.green);
      return backend;
    } else {
      printColored('❌ 后端服务器启动失败', colors.red);
      backend.kill();
      return null;
    }
  } catch (error) {
    printColored(`❌ 检查后端服务器失败: ${error.message}`, colors.red);
    backend.kill();
    return null;
  }
}

// 启动前端服务器
async function startFrontend() {
  printColored('正在启动前端服务器...', colors.magenta);
  
  // 检查端口是否被占用
  const isPortBusy = await checkPort(FRONTEND_PORT);
  if (isPortBusy) {
    printColored(`端口 ${FRONTEND_PORT} 已被占用，正在尝试释放...`, colors.yellow);
    await killProcessOnPort(FRONTEND_PORT);
    // 等待端口释放
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 检查前端目录是否存在
  if (!fs.existsSync(frontendDir)) {
    printColored(`❌ 前端目录不存在: ${frontendDir}`, colors.red);
    return null;
  }
  
  // 检查前端package.json是否存在
  const packageJsonPath = path.join(frontendDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    printColored(`❌ 前端package.json不存在: ${packageJsonPath}`, colors.red);
    return null;
  }
  
  // 启动前端服务器
  const frontend = spawn('npm', ['start'], {
    cwd: frontendDir,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none' } // 不自动打开浏览器
  });
  
  frontend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.magenta}[前端] ${data}${colors.reset}`);
  });
  
  frontend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[前端错误] ${data}${colors.reset}`);
  });
  
  // 等待前端启动
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  printColored(`✅ 前端服务器已启动，运行在端口 ${FRONTEND_PORT}`, colors.green);
  return frontend;
}

// 打开浏览器
function openBrowser() {
  printColored('正在打开浏览器...', colors.bright);
  exec(`start http://localhost:${FRONTEND_PORT}`);
}

// 主函数
async function main() {
  printColored('=== TTKH旅游系统启动程序 ===', colors.bright + colors.cyan);
  
  // 检查数据库
  const dbOk = await checkDatabase();
  if (!dbOk) {
    printColored('❌ 数据库检查失败，无法继续启动系统', colors.red);
    return;
  }
  
  // 启动后端
  const backend = await startBackend();
  if (!backend) {
    printColored('❌ 后端启动失败，无法继续启动系统', colors.red);
    return;
  }
  
  // 启动前端
  const frontend = await startFrontend();
  if (!frontend) {
    printColored('❌ 前端启动失败', colors.red);
    backend.kill();
    return;
  }
  
  // 打开浏览器
  openBrowser();
  
  printColored('\n=== 系统启动成功 ===', colors.bright + colors.green);
  printColored('前端: http://localhost:3000', colors.green);
  printColored('后端: http://localhost:3001', colors.green);
  printColored('\n按 Ctrl+C 停止所有服务', colors.yellow);
  
  // 处理进程退出
  process.on('SIGINT', () => {
    printColored('\n正在关闭所有服务...', colors.yellow);
    frontend.kill();
    backend.kill();
    printColored('所有服务已关闭', colors.green);
    process.exit(0);
  });
}

// 运行主函数
main().catch(error => {
  printColored(`❌ 启动失败: ${error.message}`, colors.red);
});