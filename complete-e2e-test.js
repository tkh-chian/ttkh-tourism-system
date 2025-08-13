const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
    constructor() {
        this.backendProcess = null;
        this.frontendProcess = null;
        this.testResults = [];
        this.baseURL = 'http://localhost:3001';
        this.frontendURL = 'http://localhost:3000';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleString('zh-CN');
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
        this.testResults.push({ timestamp, type, message });
    }

    async killProcessOnPort(port) {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                if (stdout) {
                    const lines = stdout.split('\n');
                    const pids = lines
                        .filter(line => line.includes('LISTENING'))
                        .map(line => line.trim().split(/\s+/).pop())
                        .filter(pid => pid && !isNaN(pid));
                    
                    if (pids.length > 0) {
                        exec(`taskkill /F /PID ${pids.join(' /PID ')}`, () => {
                            this.log(`已清理端口 ${port} 上的进程`);
                            setTimeout(resolve, 1000);
                        });
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        });
    }

    async startBackend() {
        this.log('正在启动后端服务器...');
        
        return new Promise((resolve, reject) => {
            this.backendProcess = spawn('node', ['simple-server.js'], {
                cwd: path.join(__dirname, 'backend'),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let backendReady = false;

            this.backendProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('服务器启动成功') || output.includes('Server running')) {
                    backendReady = true;
                    this.log('后端服务器启动成功', 'success');
                    resolve();
                }
            });

            this.backendProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('EADDRINUSE')) {
                    this.log('端口被占用，正在重试...', 'error');
                    reject(new Error('Backend port in use'));
                }
            });

            setTimeout(() => {
                if (!backendReady) {
                    this.log('后端启动超时', 'error');
                    reject(new Error('Backend startup timeout'));
                }
            }, 10000);
        });
    }

    async startFrontend() {
        this.log('正在启动前端服务器...');
        
        return new Promise((resolve, reject) => {
            this.frontendProcess = spawn('npm', ['start'], {
                cwd: path.join(__dirname, 'frontend'),
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let frontendReady = false;

            this.frontendProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('webpack compiled') || output.includes('Local:')) {
                    frontendReady = true;
                    this.log('前端服务器启动成功', 'success');
                    resolve();
                }
            });

            this.frontendProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('EADDRINUSE')) {
                    this.log('前端端口被占用，正在重试...', 'error');
                    reject(new Error('Frontend port in use'));
                }
            });

            setTimeout(() => {
                if (!frontendReady) {
                    this.log('前端启动超时', 'error');
                    reject(new Error('Frontend startup timeout'));
                }
            }, 30000);
        });
    }

    async testBackendAPI() {
        this.log('开始测试后端API...');
        
        try {
            // 测试健康检查
            const healthResponse = await axios.get(`${this.baseURL}/api/health`);
            this.log('健康检查通过', 'success');

            // 测试管理员登录
            const adminLogin = await axios.post(`${this.baseURL}/api/auth/login`, {
                email: 'admin@ttkh.com',
                password: 'admin123'
            });
            
            if (adminLogin.data.success && adminLogin.data.data.token) {
                this.log('管理员登录成功', 'success');
                const adminToken = adminLogin.data.data.token;

                // 测试获取产品列表
                const productsResponse = await axios.get(`${this.baseURL}/api/products`);
                this.log(`获取产品列表成功，共 ${productsResponse.data.data.products.length} 个产品`, 'success');

                // 测试获取商家列表
                const merchantsResponse = await axios.get(`${this.baseURL}/api/admin/merchants`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                this.log(`获取商家列表成功，共 ${merchantsResponse.data.data.users.length} 个商家`, 'success');

                return true;
            }
        } catch (error) {
            this.log(`后端API测试失败: ${error.message}`, 'error');
            return false;
        }
    }

    async testFrontendAccess() {
        this.log('测试前端访问...');
        
        try {
            const response = await axios.get(this.frontendURL, { timeout: 5000 });
            if (response.status === 200) {
                this.log('前端页面访问成功', 'success');
                return true;
            }
        } catch (error) {
            this.log(`前端访问失败: ${error.message}`, 'error');
            return false;
        }
        return false;
    }

    async runCompleteTest() {
        this.log('🚀 开始端对端测试流程');
        
        try {
            // 1. 清理端口
            await this.killProcessOnPort(3001);
            await this.killProcessOnPort(3000);
            
            // 2. 初始化数据库
            this.log('初始化数据库...');
            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec('node init-simple.js', { cwd: path.join(__dirname, 'backend') }, (error, stdout, stderr) => {
                    if (error) {
                        this.log(`数据库初始化失败: ${error.message}`, 'error');
                        reject(error);
                    } else {
                        this.log('数据库初始化成功', 'success');
                        resolve();
                    }
                });
            });

            // 3. 启动后端
            await this.startBackend();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 4. 测试后端API
            const backendTest = await this.testBackendAPI();
            if (!backendTest) {
                throw new Error('后端API测试失败');
            }

            // 5. 启动前端
            await this.startFrontend();
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 6. 测试前端访问
            const frontendTest = await this.testFrontendAccess();
            if (!frontendTest) {
                throw new Error('前端访问测试失败');
            }

            // 7. 生成测试报告
            this.generateTestReport();
            
            this.log('🎉 端对端测试完成！系统运行正常', 'success');
            this.log(`📍 前端地址: ${this.frontendURL}`, 'success');
            this.log(`📍 后端地址: ${this.baseURL}`, 'success');
            
            return true;

        } catch (error) {
            this.log(`测试失败: ${error.message}`, 'error');
            this.cleanup();
            return false;
        }
    }

    generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            summary: {
                total: this.testResults.length,
                success: this.testResults.filter(r => r.type === 'success').length,
                errors: this.testResults.filter(r => r.type === 'error').length
            },
            urls: {
                frontend: this.frontendURL,
                backend: this.baseURL
            },
            testAccounts: {
                admin: { email: 'admin@ttkh.com', password: 'admin123' },
                merchant: { email: 'merchant@test.com', password: '123456' },
                agent: { email: 'agent@test.com', password: '123456' },
                customer: { email: 'user@test.com', password: '123456' }
            }
        };

        fs.writeFileSync(
            path.join(__dirname, 'e2e-test-report.json'),
            JSON.stringify(report, null, 2)
        );

        this.log('测试报告已生成: e2e-test-report.json', 'success');
    }

    cleanup() {
        if (this.backendProcess) {
            this.backendProcess.kill();
            this.log('后端进程已停止');
        }
        if (this.frontendProcess) {
            this.frontendProcess.kill();
            this.log('前端进程已停止');
        }
    }
}

// 运行测试
const testRunner = new E2ETestRunner();

process.on('SIGINT', () => {
    console.log('\n收到中断信号，正在清理...');
    testRunner.cleanup();
    process.exit(0);
});

testRunner.runCompleteTest().then(success => {
    if (success) {
        console.log('\n🎉 测试成功完成！您可以开始使用系统了。');
        console.log('按 Ctrl+C 停止服务器');
        
        // 保持进程运行
        process.stdin.resume();
    } else {
        console.log('\n❌ 测试失败，请检查错误信息');
        process.exit(1);
    }
}).catch(error => {
    console.error('测试运行出错:', error);
    testRunner.cleanup();
    process.exit(1);
});