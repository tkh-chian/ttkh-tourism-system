const mysql = require('mysql2/promise');

async function debugMerchantsPage() {
    console.log('🔍 实时调试商家管理页面问题...\n');
    
    try {
        // 连接数据库
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Lhjr@170103',
            database: 'ttkh_tourism'
        });

        console.log('✅ 数据库连接成功\n');

        // 1. 查看所有用户
        console.log('📊 所有用户列表：');
        const [allUsers] = await connection.execute('SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC');
        console.table(allUsers);

        // 2. 查看商家用户
        console.log('\n🏪 商家用户列表：');
        const [merchants] = await connection.execute('SELECT id, username, email, role, status, created_at FROM users WHERE role = "merchant" ORDER BY created_at DESC');
        console.table(merchants);

        // 3. 查看待审核用户
        console.log('\n⏳ 待审核用户列表：');
        const [pendingUsers] = await connection.execute('SELECT id, username, email, role, status, created_at FROM users WHERE status = "pending" ORDER BY created_at DESC');
        console.table(pendingUsers);

        // 4. 测试管理员API
        console.log('\n🔧 测试管理员API...');
        const axios = require('axios');
        
        // 先登录管理员获取token
        try {
            const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'admin@ttkh.com',
                password: 'admin123'
            });
            
            const token = loginResponse.data.token;
            console.log('✅ 管理员登录成功，获取到token');

            // 测试获取用户列表API
            const usersResponse = await axios.get('http://localhost:3001/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('\n📋 管理员API返回的用户列表：');
            console.table(usersResponse.data.users || usersResponse.data);

        } catch (apiError) {
            console.error('❌ API测试失败：', apiError.response?.data || apiError.message);
        }

        await connection.end();

    } catch (error) {
        console.error('❌ 调试失败：', error.message);
    }
}

debugMerchantsPage();