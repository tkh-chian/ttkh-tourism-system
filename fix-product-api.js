const axios = require('axios');

async function fixProductAPI() {
    console.log('🔧 修复产品API问题...\n');
    
    try {
        // 1. 测试商家登录
        console.log('=== 1. 测试商家登录 ===');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            username: 'merchant',
            password: 'merchant123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 商家登录成功');
        
        // 2. 测试简单产品创建
        console.log('\n=== 2. 测试产品创建 ===');
        const productData = {
            name: '修复测试产品',
            title_zh: '修复测试产品',
            title_th: 'ผลิตภัณฑ์ทดสอบการแก้ไข',
            description_zh: '这是修复测试产品',
            description_th: 'นี่คือผลิตภัณฑ์ทดสอบการแก้ไข',
            price: 1999,
            base_price: 1999
        };
        
        console.log('发送数据:', JSON.stringify(productData, null, 2));
        console.log('使用Token:', token.substring(0, 20) + '...');
        
        const createResponse = await axios.post('http://localhost:3001/api/products', productData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 产品创建成功');
        console.log('响应数据:', JSON.stringify(createResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ 错误详情:');
        console.error('状态码:', error.response?.status);
        console.error('错误消息:', error.response?.data?.message || error.message);
        console.error('完整错误:', error.response?.data);
        
        if (error.response?.status === 500) {
            console.log('\n🔍 这是服务器内部错误，可能的原因:');
            console.log('1. 数据库连接问题');
            console.log('2. 模型定义问题');
            console.log('3. 字段验证问题');
            console.log('4. JWT token解析问题');
        }
    }
}

fixProductAPI();