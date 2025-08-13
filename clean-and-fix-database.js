const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism',
    charset: 'utf8mb4'
};

async function cleanAndFixDatabase() {
    let connection;
    
    try {
        console.log('🔧 开始清理并修复数据库...');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');

        // 1. 完全清理测试用户
        console.log('📋 完全清理测试用户...');
        await connection.execute(`
            DELETE FROM users WHERE username IN ('admin', 'merchant', 'agent', 'customer')
            OR email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
        `);
        console.log('  ✅ 测试用户清理完成');

        // 2. 创建唯一的测试用户
        console.log('📋 创建唯一测试用户...');
        
        const testUsers = [
            {
                id: uuidv4(),
                username: 'admin_test',
                email: 'admin@ttkh.com',
                password: 'admin123',
                role: 'admin',
                name: '系统管理员',
                status: 'approved'
            },
            {
                id: uuidv4(),
                username: 'merchant_test',
                email: 'merchant@test.com',
                password: '123456',
                role: 'merchant',
                name: '测试商家',
                company_name: '测试旅游公司',
                contact_person: '张三',
                phone: '1234567890',
                status: 'approved'
            },
            {
                id: uuidv4(),
                username: 'agent_test',
                email: 'agent@test.com',
                password: '123456',
                role: 'agent',
                name: '测试代理',
                company_name: '测试代理公司',
                contact_person: '李四',
                phone: '0987654321',
                status: 'approved'
            },
            {
                id: uuidv4(),
                username: 'customer_test',
                email: 'user@test.com',
                password: '123456',
                role: 'customer',
                name: '测试用户',
                phone: '1122334455',
                status: 'approved'
            }
        ];

        // 插入用户
        for (const user of testUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const now = new Date();
            
            const insertSQL = `
                INSERT INTO users (
                    id, username, email, password, role, name, 
                    company_name, contact_person, phone, status,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(insertSQL, [
                user.id,
                user.username,
                user.email,
                hashedPassword,
                user.role,
                user.name,
                user.company_name || null,
                user.contact_person || null,
                user.phone || null,
                user.status,
                now,
                now
            ]);
            
            console.log(`  ✅ 创建用户: ${user.email} (${user.role})`);
        }

        // 3. 验证用户创建
        console.log('📋 验证用户创建...');
        const [users] = await connection.execute(`
            SELECT id, username, email, role, status FROM users 
            WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')
        `);
        
        console.log('✅ 已创建的测试用户:');
        users.forEach(user => {
            console.log(`  - ${user.email}: ${user.role} (${user.status})`);
        });

        console.log('🎉 数据库清理和修复完成！');
        console.log('📋 测试账户已创建:');
        console.log('   管理员: admin@ttkh.com / admin123');
        console.log('   商家: merchant@test.com / 123456');
        console.log('   代理: agent@test.com / 123456');
        console.log('   用户: user@test.com / 123456');

        return true;

    } catch (error) {
        console.error('❌ 数据库修复失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行修复
if (require.main === module) {
    cleanAndFixDatabase()
        .then(() => {
            console.log('✅ 数据库修复完成，可以重新运行测试');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 修复失败:', error);
            process.exit(1);
        });
}

module.exports = { cleanAndFixDatabase };