const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
    console.log('🔧 修复管理员密码...');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lhjr@170103',
        database: 'ttkh_tourism'
    });
    
    try {
        // 生成新的密码哈希
        const hashedPassword = await bcrypt.hash('admin123', 10);
        console.log('✅ 密码哈希生成成功');
        
        // 更新管理员密码
        await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@ttkh.com']
        );
        
        console.log('✅ 管理员密码更新成功');
        
        // 验证更新
        const [rows] = await connection.execute(
            'SELECT id, email, role, password FROM users WHERE email = ?',
            ['admin@ttkh.com']
        );
        
        if (rows.length > 0) {
            console.log('✅ 管理员账户验证成功');
            console.log(`   ID: ${rows[0].id}`);
            console.log(`   邮箱: ${rows[0].email}`);
            console.log(`   角色: ${rows[0].role}`);
            console.log(`   密码哈希: ${rows[0].password.substring(0, 20)}...`);
            
            // 测试密码验证
            const isValid = await bcrypt.compare('admin123', rows[0].password);
            console.log(`   密码验证: ${isValid ? '✅ 成功' : '❌ 失败'}`);
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error);
    } finally {
        await connection.end();
    }
}

fixAdminPassword();