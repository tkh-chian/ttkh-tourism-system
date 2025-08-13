const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function fixTokenIssue() {
    console.log('🔧 修复Token问题...\n');
    
    try {
        // 1. 测试登录并获取完整响应
        console.log('=== 测试商家登录 ===');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'merchant',
            password: 'merchant123'
        });
        
        console.log('登录响应结构:', JSON.stringify(loginResponse.data, null, 2));
        
        // 2. 检查token格式
        const token = loginResponse.data.token;
        console.log('Token:', token);
        console.log('Token类型:', typeof token);
        console.log('Token长度:', token ? token.length : 'undefined');
        
        if (token) {
            // 3. 测试使用token访问受保护的API
            console.log('\n=== 测试Token访问 ===');
            try {
                const testResponse = await axios.get(`${API_BASE}/products`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Token验证成功');
            } catch (error) {
                console.log('❌ Token验证失败:', error.response?.data?.message || error.message);
                console.log('错误详情:', error.response?.data);
            }
        }
        
    } catch (error) {
        console.error('❌ 登录失败:', error.response?.data?.message || error.message);
        console.log('错误详情:', error.response?.data);
    }
}

fixTokenIssue();