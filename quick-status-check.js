const axios = require('axios');

async function quickStatusCheck() {
    console.log('🔍 快速系统状态检查...\n');
    
    try {
        // 检查后端服务器
        console.log('=== 后端服务器状态 ===');
        try {
            const healthResponse = await axios.get('http://localhost:3001/api/health');
            console.log('✅ 后端服务器运行正常');
            console.log('📊 数据库连接:', healthResponse.data.database ? '✅ 正常' : '❌ 异常');
        } catch (error) {
            console.log('❌ 后端服务器无法访问');
        }
        
        // 检查前端服务器
        console.log('\n=== 前端服务器状态 ===');
        try {
            const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
            console.log('✅ 前端服务器运行正常');
        } catch (error) {
            console.log('❌ 前端服务器无法访问');
        }
        
        // 测试管理员登录
        console.log('\n=== 管理员认证测试 ===');
        try {
            const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'admin@ttkh.com',
                password: 'admin123'
            });
            
            if (loginResponse.data.token) {
                console.log('✅ 管理员登录成功');
                console.log('🔑 Token已生成');
                
                // 测试商家管理API
                const token = loginResponse.data.token;
                try {
                    const merchantsResponse = await axios.get('http://localhost:3001/api/admin/merchants', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('✅ 商家管理API正常');
                    console.log('📊 商家数量:', merchantsResponse.data.length || 0);
                } catch (error) {
                    console.log('❌ 商家管理API异常:', error.response?.status || error.message);
                }
                
            } else {
                console.log('❌ 管理员登录失败');
            }
        } catch (error) {
            console.log('❌ 管理员认证失败:', error.response?.data?.message || error.message);
        }
        
        console.log('\n=== 系统状态总结 ===');
        console.log('前端服务: http://localhost:3000');
        console.log('后端服务: http://localhost:3001');
        console.log('管理员账号: admin@ttkh.com / admin123');
        
    } catch (error) {
        console.error('❌ 状态检查过程中发生错误:', error.message);
    }
}

quickStatusCheck();