const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixLoginAPI() {
    console.log('🔧 修复登录API问题...');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lhjr@170103',
        database: 'ttkh_tourism'
    });
    
    try {
        // 检查管理员用户数据
        const [rows] = await connection.execute(
            'SELECT id, email, password, role FROM users WHERE email = ?',
            ['admin@ttkh.com']
        );
        
        if (rows.length === 0) {
            console.log('❌ 管理员用户不存在');
            return;
        }
        
        const user = rows[0];
        console.log('✅ 找到管理员用户:');
        console.log(`   ID: ${user.id}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   密码哈希长度: ${user.password ? user.password.length : 'null'}`);
        
        // 测试密码比较
        if (user.password) {
            try {
                const isValid = await bcrypt.compare('admin123', user.password);
                console.log(`   密码验证结果: ${isValid ? '✅ 成功' : '❌ 失败'}`);
            } catch (error) {
                console.log(`   密码验证错误: ${error.message}`);
                
                // 重新生成密码哈希
                console.log('🔄 重新生成密码哈希...');
                const newHash = await bcrypt.hash('admin123', 10);
                
                await connection.execute(
                    'UPDATE users SET password = ? WHERE email = ?',
                    [newHash, 'admin@ttkh.com']
                );
                
                console.log('✅ 密码哈希重新生成完成');
                
                // 再次验证
                const testValid = await bcrypt.compare('admin123', newHash);
                console.log(`   新密码验证: ${testValid ? '✅ 成功' : '❌ 失败'}`);
            }
        } else {
            console.log('❌ 密码字段为空，重新设置...');
            const newHash = await bcrypt.hash('admin123', 10);
            
            await connection.execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [newHash, 'admin@ttkh.com']
            );
            
            console.log('✅ 密码设置完成');
        }
        
        // 测试登录API
        console.log('\n🧪 测试登录API...');
        const axios = require('axios');
        
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'admin@ttkh.com',
                password: 'admin123'
            }, { timeout: 5000 });
            
            if (response.status === 200 && response.data.token) {
                console.log('✅ 登录API测试成功');
                console.log(`   令牌: ${response.data.token.substring(0, 20)}...`);
                console.log(`   用户: ${response.data.user.email} (${response.data.user.role})`);
            } else {
                console.log('❌ 登录API返回异常');
            }
        } catch (error) {
            console.log(`❌ 登录API测试失败: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error);
    } finally {
        await connection.end();
    }
}

fixLoginAPI();