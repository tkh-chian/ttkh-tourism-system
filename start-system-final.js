const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

// 测试配置
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

let backendProcess = null;
let frontendProcess = null;

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('zh-CN');
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// 清理端口
async function cleanupPorts() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
        // 清理3001端口
        try {
            const result3001 = await execAsync('netstat -ano | findstr :3001');
            if (result3001.stdout) {
                await execAsync('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3001\') do taskkill /PID %a /F');
                log('已清理端口 3001');
            }
        } catch (e) {
            log('端口 3001 未被占用');
        }
        
        // 清理3000端口
        try {
            const result3000 = await execAsync('netstat -ano | findstr :3000');
            if (result3000.stdout) {
                await execAsync('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3000\') do taskkill /PID %a /F');
                log('已清理端口 3000');
            }
        } catch (e) {
            log('端口 3000 未被占用');
        }
        
        // 等待端口释放
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        log(`端口清理过程中出现错误: ${error.message}`, 'error');
    }
}

// 启动后端服务器
async function startBackend() {
    return new Promise((resolve, reject) => {
        log('正在启动后端服务器...');
        
        backendProcess = spawn('node', ['backend/simple-server.js'], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        let errorOutput = '';
        
        backendProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log('后端输出:', text.trim());
            
            if (text.includes('服务器运行在端口 3001') || text.includes('Server running on port 3001')) {
                log('后端服务器启动成功', 'success');
                resolve();
            }
        });
        
        backendProcess.stderr.on('data', (data) => {
            const error = data.toString();
            errorOutput += error;
            console.log('后端错误:', error.trim());
            
            if (error.includes('EADDRINUSE')) {
                log('端口 3001 被占用', 'error');
                reject(new Error('端口被占用'));
            }
        });
        
        backendProcess.on('error', (error) => {
            log(`后端启动失败: ${error.message}`, 'error');
            reject(error);
        });
        
        backendProcess.on('exit', (code) => {
            if (code !== 0) {
                log(`后端进程退出，代码: ${code}`, 'error');
                log(`输出: ${output}`);
                log(`错误: ${errorOutput}`);
                reject(new Error(`后端进程退出，代码: ${code}`));
            }
        });
        
        // 超时处理
        setTimeout(() => {
            if (!output.includes('服务器运行在端口 3001') && !output.includes('Server running on port 3001')) {
                log('后端启动超时，输出内容:', 'error');
                log(output);
                log('错误内容:');
                log(errorOutput);
                reject(new Error('后端启动超时'));
            }
        }, 15000);
    });
}

// 启动前端服务器
async function startFrontend() {
    return new Promise((resolve, reject) => {
        log('正在启动前端服务器...');
        
        frontendProcess = spawn('npm', ['start'], {
            cwd: path.join(process.cwd(), 'frontend'),
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        
        frontendProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            
            if (text.includes('webpack compiled') || text.includes('Local:') || text.includes('localhost:3000')) {
                log('前端服务器启动成功', 'success');
                resolve();
            }
        });
        
        frontendProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (error.includes('EADDRINUSE')) {
                log('端口 3000 被占用', 'error');
                reject(new Error('端口被占用'));
            }
        });
        
        frontendProcess.on('error', (error) => {
            log(`前端启动失败: ${error.message}`, 'error');
            reject(error);
        });
        
        // 超时处理
        setTimeout(() => {
            if (!output.includes('webpack compiled') && !output.includes('Local:') && !output.includes('localhost:3000')) {
                log('前端启动超时', 'error');
                reject(new Error('前端启动超时'));
            }
        }, 60000);
    });
}

// 等待服务器就绪
async function waitForServer(url, maxAttempts = 30) {
    log(`等待服务器就绪: ${url}`);
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await axios.get(url, { timeout: 3000 });
            log(`服务器就绪: ${url}`, 'success');
            return true;
        } catch (error) {
            log(`尝试 ${i + 1}/${maxAttempts}: ${url} 未就绪`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    log(`服务器未就绪: ${url}`, 'error');
    return false;
}

// 测试后端API
async function testBackendAPI() {
    log('开始测试后端API...');
    
    try {
        // 测试健康检查
        const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
        if (healthResponse.status === 200) {
            log('✓ 健康检查通过');
        }
        
        // 测试用户登录
        const testUsers = {
            admin: { email: 'admin@ttkh.com', password: 'admin123' },
            merchant: { email: 'merchant@test.com', password: '123456' },
            agent: { email: 'agent@test.com', password: '123456' },
            customer: { email: 'user@test.com', password: '123456' }
        };
        
        for (const [role, credentials] of Object.entries(testUsers)) {
            try {
                const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials, { timeout: 5000 });
                if (loginResponse.status === 200 && loginResponse.data.token) {
                    log(`✓ ${role} 登录成功`);
                } else {
                    log(`✗ ${role} 登录失败`, 'error');
                }
            } catch (error) {
                log(`✗ ${role} 登录失败: ${error.message}`, 'error');
            }
        }
        
        // 测试产品API
        try {
            const productsResponse = await axios.get(`${BACKEND_URL}/api/products`, { timeout: 5000 });
            if (productsResponse.status === 200) {
                log('✓ 产品列表API正常');
            }
        } catch (error) {
            log(`✗ 产品列表API失败: ${error.message}`, 'error');
        }
        
        log('后端API测试完成', 'success');
        return true;
        
    } catch (error) {
        log(`后端API测试失败: ${error.message}`, 'error');
        return false;
    }
}

// 测试前端访问
async function testFrontendAccess() {
    log('开始测试前端访问...');
    
    try {
        const response = await axios.get(FRONTEND_URL, { timeout: 10000 });
        if (response.status === 200) {
            log('✓ 前端页面可访问', 'success');
            return true;
        }
    } catch (error) {
        log(`前端访问失败: ${error.message}`, 'error');
        return false;
    }
}

// 清理进程
function cleanup() {
    log('正在清理进程...');
    
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
        log('后端进程已停止');
    }
    
    if (frontendProcess) {
        frontendProcess.kill('SIGTERM');
        log('前端进程已停止');
    }
}

// 主启动流程
async function startSystem() {
    try {
        log('🚀 开始启动旅游系统');
        
        // 1. 清理端口
        await cleanupPorts();
        
        // 2. 启动后端
        await startBackend();
        
        // 3. 等待后端就绪
        const backendReady = await waitForServer(`${BACKEND_URL}/api/health`);
        if (!backendReady) {
            throw new Error('后端服务器未就绪');
        }
        
        // 4. 测试后端API
        const backendTestPassed = await testBackendAPI();
        if (!backendTestPassed) {
            log('后端API测试失败，但继续启动前端', 'error');
        }
        
        // 5. 启动前端
        await startFrontend();
        
        // 6. 等待前端就绪
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 7. 测试前端访问
        const frontendTestPassed = await testFrontendAccess();
        if (!frontendTestPassed) {
            log('前端访问测试失败，但系统已启动', 'error');
        }
        
        log('🎉 旅游系统启动完成！', 'success');
        log('📋 系统访问地址:');
        log('   后端API: http://localhost:3001');
        log('   前端界面: http://localhost:3000');
        log('📋 测试账户:');
        log('   管理员: admin@ttkh.com / admin123');
        log('   商家: merchant@test.com / 123456');
        log('   代理: agent@test.com / 123456');
        log('   用户: user@test.com / 123456');
        log('📋 系统将继续运行，按 Ctrl+C 停止');
        
        // 监听退出信号
        process.on('SIGINT', () => {
            log('收到退出信号，正在清理...');
            cleanup();
            process.exit(0);
        });
        
        // 保持进程运行
        await new Promise(() => {});
        
    } catch (error) {
        log(`系统启动失败: ${error.message}`, 'error');
        cleanup();
        process.exit(1);
    }
}

// 运行启动
if (require.main === module) {
    startSystem();
}

module.exports = { startSystem };