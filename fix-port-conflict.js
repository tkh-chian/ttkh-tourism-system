const { exec } = require('child_process');
const axios = require('axios');

async function fixPortConflict() {
    console.log('🔧 修复端口冲突问题...\n');
    
    try {
        // 1. 查找占用3001端口的进程
        console.log('=== 1. 查找占用端口3001的进程 ===');
        
        const findProcess = () => {
            return new Promise((resolve, reject) => {
                exec('netstat -ano | findstr :3001', (error, stdout, stderr) => {
                    if (error) {
                        console.log('✅ 端口3001未被占用');
                        resolve(null);
                        return;
                    }
                    
                    const lines = stdout.split('\n').filter(line => line.trim());
                    if (lines.length > 0) {
                        const pid = lines[0].trim().split(/\s+/).pop();
                        console.log(`🔍 发现进程占用端口3001，PID: ${pid}`);
                        resolve(pid);
                    } else {
                        resolve(null);
                    }
                });
            });
        };
        
        const pid = await findProcess();
        
        // 2. 如果有进程占用，则终止它
        if (pid) {
            console.log('\n=== 2. 终止占用进程 ===');
            await new Promise((resolve, reject) => {
                exec(`taskkill /F /PID ${pid}`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`⚠️ 无法终止进程 ${pid}:`, error.message);
                    } else {
                        console.log(`✅ 已终止进程 ${pid}`);
                    }
                    resolve();
                });
            });
            
            // 等待端口释放
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 3. 启动后端服务
        console.log('\n=== 3. 启动后端服务 ===');
        const backendProcess = exec('npm run dev', {
            cwd: './backend'
        });
        
        backendProcess.stdout.on('data', (data) => {
            console.log(`后端: ${data.toString().trim()}`);
        });
        
        backendProcess.stderr.on('data', (data) => {
            console.error(`后端错误: ${data.toString().trim()}`);
        });
        
        // 4. 等待服务启动并测试
        console.log('\n=== 4. 等待服务启动 ===');
        let attempts = 0;
        const maxAttempts = 15;
        
        while (attempts < maxAttempts) {
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const response = await axios.get('http://localhost:3001/health');
                console.log('✅ 后端服务启动成功！');
                console.log(`📊 健康状态: ${response.data.status}`);
                break;
            } catch (error) {
                attempts++;
                console.log(`⏳ 等待服务启动... (${attempts}/${maxAttempts})`);
                
                if (attempts >= maxAttempts) {
                    throw new Error('后端服务启动超时');
                }
            }
        }
        
        // 5. 测试产品API
        console.log('\n=== 5. 测试产品API ===');
        try {
            const productsResponse = await axios.get('http://localhost:3001/api/products');
            console.log('✅ 产品API测试成功');
            console.log(`📦 产品数量: ${productsResponse.data.data?.length || 0}`);
        } catch (error) {
            console.log(`⚠️ 产品API测试失败: ${error.response?.status} ${error.message}`);
        }
        
        console.log('\n🎉 端口冲突修复完成！');
        console.log('🌐 前端地址: http://localhost:3000');
        console.log('🔧 后端地址: http://localhost:3001');
        console.log('🏥 健康检查: http://localhost:3001/health');
        
        console.log('\n📋 现在可以进行完整测试:');
        console.log('1. 商家登录: merchant / merchant123');
        console.log('2. 上传产品');
        console.log('3. 管理员审核: admin / admin123');
        console.log('4. 用户下单: customer / customer123');
        
    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        console.log('\n🔧 手动解决步骤:');
        console.log('1. 按 Ctrl+C 停止所有Node进程');
        console.log('2. 打开任务管理器，结束所有node.exe进程');
        console.log('3. 重新运行: cd ttkh-tourism-system/backend && npm run dev');
        console.log('4. 等待看到"服务器已启动"消息');
    }
}

fixPortConflict();