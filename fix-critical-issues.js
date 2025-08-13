const mysql = require('mysql2/promise');

async function fixCriticalIssues() {
    console.log('🔧 修复关键系统问题...\n');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lhjr@170103',
        database: 'ttkh_tourism'
    });
    
    try {
        // 1. 修复products表 - 添加created_at和updated_at字段
        console.log('1️⃣ 修复products表字段...');
        
        // 检查字段是否存在
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ttkh_tourism' 
            AND TABLE_NAME = 'products'
            AND COLUMN_NAME IN ('created_at', 'updated_at')
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        if (!existingColumns.includes('created_at')) {
            await connection.execute(`
                ALTER TABLE products 
                ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ 添加created_at字段');
        }
        
        if (!existingColumns.includes('updated_at')) {
            await connection.execute(`
                ALTER TABLE products 
                ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
            console.log('✅ 添加updated_at字段');
        }
        
        // 2. 检查并修复用户密码字段
        console.log('\n2️⃣ 检查用户密码字段...');
        const [users] = await connection.execute(`
            SELECT id, email, password 
            FROM users 
            WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
        `);
        
        console.log('当前用户状态:');
        for (const user of users) {
            console.log(`   ${user.email}: 密码${user.password ? '已设置' : '未设置'}`);
        }
        
        // 3. 重新设置所有测试用户密码
        console.log('\n3️⃣ 重新设置测试用户密码...');
        const bcrypt = require('bcryptjs');
        
        const testUsers = [
            { email: 'admin@ttkh.com', password: 'admin123', role: 'admin' },
            { email: 'merchant@test.com', password: '123456', role: 'merchant' },
            { email: 'agent@test.com', password: '123456', role: 'agent' },
            { email: 'user@test.com', password: '123456', role: 'customer' }
        ];
        
        for (const user of testUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            await connection.execute(`
                UPDATE users 
                SET password = ?, status = 'approved'
                WHERE email = ?
            `, [hashedPassword, user.email]);
            
            console.log(`✅ 更新${user.email}密码`);
        }
        
        // 4. 验证修复结果
        console.log('\n4️⃣ 验证修复结果...');
        
        // 检查products表结构
        const [productColumns] = await connection.execute(`
            SHOW COLUMNS FROM products
        `);
        
        const hasCreatedAt = productColumns.some(col => col.Field === 'created_at');
        const hasUpdatedAt = productColumns.some(col => col.Field === 'updated_at');
        
        console.log(`   Products表 created_at: ${hasCreatedAt ? '✅' : '❌'}`);
        console.log(`   Products表 updated_at: ${hasUpdatedAt ? '✅' : '❌'}`);
        
        // 检查用户密码
        const [updatedUsers] = await connection.execute(`
            SELECT email, password IS NOT NULL as has_password, status
            FROM users 
            WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
        `);
        
        console.log('\n   用户状态:');
        for (const user of updatedUsers) {
            console.log(`   ${user.email}: 密码${user.has_password ? '✅' : '❌'} 状态${user.status}`);
        }
        
        console.log('\n🎉 关键问题修复完成！');
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error.message);
    } finally {
        await connection.end();
    }
}

// 运行修复
if (require.main === module) {
    fixCriticalIssues();
}

module.exports = { fixCriticalIssues };