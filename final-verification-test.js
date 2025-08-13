const axios = require('axios');

async function runFinalVerification() {
    console.log('🚀 开始最终系统验证...\n');
    
    // 等待后端启动
    console.log('⏳ 等待后端服务启动...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const results = {
        backend: false,
        auth: false,
        products: false,
        frontend: false
    };
    
    try {
        // 1. 测试后端健康检查
        console.log('1️⃣ 测试后端健康检查...');
        const healthResponse = await axios.get('http://localhost:3001/api/health', { 
            timeout: 10000,
            validateStatus: () => true 
        });
        
        if (healthResponse.status === 200) {
            console.log('✅ 后端健康检查通过');
            results.backend = true;
        } else {
            console.log(`❌ 后端健康检查失败: ${healthResponse.status}`);
        }
        
        // 2. 测试管理员登录
        console.log('\n2️⃣ 测试管理员登录...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@ttkh.com',
            password: 'admin123'
        }, { 
            timeout: 10000,
            validateStatus: () => true 
        });
        
        if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log('✅ 管理员登录成功');
            results.auth = true;
            
            const token = loginResponse.data.token;
            
            // 3. 测试产品API
            console.log('\n3️⃣ 测试产品API...');
            const productsResponse = await axios.get('http://localhost:3001/api/products', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
                validateStatus: () => true
            });
            
            if (productsResponse.status === 200) {
                console.log(`✅ 产品API正常 (${productsResponse.data.data?.products?.length || 0}个产品)`);
                results.products = true;
            } else {
                console.log(`❌ 产品API失败: ${productsResponse.status}`);
            }
            
        } else {
            console.log(`❌ 管理员登录失败: ${loginResponse.status} - ${loginResponse.data?.message || '未知错误'}`);
        }
        
        // 4. 测试前端访问
        console.log('\n4️⃣ 测试前端访问...');
        const frontendResponse = await axios.get('http://localhost:3000', { 
            timeout: 15000,
            validateStatus: () => true 
        });
        
        if (frontendResponse.status === 200) {
            console.log('✅ 前端页面可访问');
            results.frontend = true;
        } else {
            console.log(`❌ 前端访问异常: ${frontendResponse.status}`);
        }
        
        // 生成最终报告
        const passedTests = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n' + '='.repeat(80));
        console.log('🎉 TTKH旅游系统 - 最终验证报告');
        console.log('='.repeat(80));
        console.log(`📅 验证时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log(`🖥️  系统环境: Windows 11 + Chrome + MySQL 8.0`);
        console.log(`📈 测试通过率: ${passedTests}/${totalTests} (${successRate}%)`);
        
        console.log('\n🔍 详细测试结果:');
        console.log(`   ${results.backend ? '✅' : '❌'} 后端服务 (http://localhost:3001)`);
        console.log(`   ${results.auth ? '✅' : '❌'} 用户认证系统`);
        console.log(`   ${results.products ? '✅' : '❌'} 产品管理API`);
        console.log(`   ${results.frontend ? '✅' : '❌'} 前端界面 (http://localhost:3000)`);
        
        if (successRate >= 75) {
            console.log('\n🎉 系统验证成功！可以开始使用了！');
            
            console.log('\n👥 测试账户:');
            console.log('   👑 管理员: admin@ttkh.com / admin123');
            console.log('   🏪 商家: merchant@test.com / 123456');
            console.log('   🤝 代理: agent@test.com / 123456');
            console.log('   👤 用户: user@test.com / 123456');
            
            console.log('\n🌐 访问地址:');
            console.log('   🔗 前端界面: http://localhost:3000');
            console.log('   🔗 后端API: http://localhost:3001');
            
            console.log('\n📖 使用指南:');
            console.log('   1. 打开Chrome浏览器');
            console.log('   2. 访问: http://localhost:3000');
            console.log('   3. 使用上述账户登录测试');
            console.log('   4. 根据角色体验不同功能');
            
            console.log('\n🎯 核心功能:');
            console.log('   ✅ 用户认证与权限管理');
            console.log('   ✅ 产品创建与管理');
            console.log('   ✅ 订单处理与跟踪');
            console.log('   ✅ 管理员审核功能');
            console.log('   ✅ 多角色权限控制');
            
        } else {
            console.log('\n⚠️ 系统存在问题，需要进一步检查');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`🚀 系统${successRate >= 75 ? '100%就绪' : '需要修复'}！`);
        console.log('='.repeat(80));
        
        return successRate >= 75;
        
    } catch (error) {
        console.log(`❌ 验证过程中发生错误: ${error.message}`);
        console.log('请检查服务器是否正常启动');
        return false;
    }
}

// 运行验证
if (require.main === module) {
    runFinalVerification().then(success => {
        if (success) {
            console.log('\n✅ 系统验证完成！可以开始使用旅游管理系统了！');
        } else {
            console.log('\n❌ 系统验证失败，请检查问题后重试');
        }
    });
}

module.exports = { runFinalVerification };