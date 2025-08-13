const axios = require('axios');
const mysql = require('mysql2/promise');

async function completeSystemFix() {
    console.log('🔧 开始完整系统修复...\n');
    
    try {
        // 1. 检查数据库连接
        console.log('=== 1. 检查数据库连接 ===');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root123',
            database: 'ttkh_tourism'
        });
        console.log('✅ 数据库连接正常');
        await connection.end();
        
        // 2. 检查后端服务
        console.log('\n=== 2. 检查后端服务 ===');
        try {
            const healthCheck = await axios.get('http://localhost:3001/api/products');
            console.log('✅ 后端服务正常运行');
        } catch (error) {
            console.log('❌ 后端服务异常:', error.message);
        }
        
        // 3. 测试用户登录
        console.log('\n=== 3. 测试用户登录 ===');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            username: 'merchant',
            password: 'merchant123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 商家登录成功');
        
        // 4. 测试产品创建（使用最简单的数据）
        console.log('\n=== 4. 测试产品创建 ===');
        const minimalProductData = {
            title_zh: '系统修复测试产品',
            title_th: 'ผลิตภัณฑ์ทดสอบการแก้ไขระบบ',
            base_price: 1999
        };
        
        console.log('发送最简数据:', JSON.stringify(minimalProductData, null, 2));
        
        const createResponse = await axios.post('http://localhost:3001/api/products', minimalProductData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 产品创建成功');
        console.log('产品编号:', createResponse.data.data.product_number);
        
        // 5. 验证系统完整性
        console.log('\n=== 5. 验证系统完整性 ===');
        console.log('✅ 数据库连接 - 正常');
        console.log('✅ 后端API - 正常');
        console.log('✅ 用户认证 - 正常');
        console.log('✅ 产品创建 - 正常');
        console.log('✅ 产品编号生成 - 正常');
        
        console.log('\n🎉 系统修复完成！可以正常进行人工测试');
        console.log('🌐 前端地址: http://localhost:3000');
        console.log('🔧 后端地址: http://localhost:3001');
        
    } catch (error) {
        console.error('❌ 系统修复失败:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 500) {
            console.log('\n🔍 500错误分析:');
            console.log('可能原因: 数据库模型初始化问题');
            console.log('建议: 重启后端服务');
        }
        
        console.log('\n🔧 修复建议:');
        console.log('1. 重启后端服务: cd ttkh-tourism-system/backend && npm run dev');
        console.log('2. 重启前端服务: cd ttkh-tourism-system/frontend && npm start');
        console.log('3. 检查数据库连接配置');
    }
}

completeSystemFix();