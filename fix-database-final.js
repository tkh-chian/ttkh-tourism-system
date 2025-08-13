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

async function fixDatabaseFinal() {
    let connection;
    
    try {
        console.log('🔧 开始最终数据库修复...');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');

        // 1. 检查users表结构
        console.log('📋 检查users表结构...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('当前users表字段:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        // 2. 检查是否有password字段，如果没有则添加name字段
        const hasPasswordField = columns.some(col => col.COLUMN_NAME === 'password');
        const hasNameField = columns.some(col => col.COLUMN_NAME === 'name');
        
        if (!hasNameField) {
            console.log('📋 添加name字段...');
            await connection.execute(`ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT NULL`);
            console.log('  ✅ name字段添加成功');
        }

        // 3. 清空现有测试用户
        console.log('📋 清理现有测试用户...');
        await connection.execute(`
            DELETE FROM users WHERE email IN (
                'admin@ttkh.com', 'merchant@test.com', 
                'agent@test.com', 'user@test.com'
            )
        `);

        // 4. 创建测试用户（使用正确的字段名）
        console.log('📋 创建测试用户...');
        
        const testUsers = [
            {
                id: uuidv4(),
                username: 'admin',
                email: 'admin@ttkh.com',
                password: 'admin123',
                role: 'admin',
                name: '系统管理员',
                status: 'approved'
            },
            {
                id: uuidv4(),
                username: 'merchant',
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
                username: 'agent',
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
                username: 'customer',
                email: 'user@test.com',
                password: '123456',
                role: 'customer',
                name: '测试用户',
                phone: '1122334455',
                status: 'approved'
            }
        ];

        // 使用正确的字段名插入用户
        const passwordField = hasPasswordField ? 'password' : 'password_hash';
        
        for (const user of testUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            const insertSQL = `
                INSERT INTO users (
                    id, username, email, ${passwordField}, role, name, 
                    company_name, contact_person, phone, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                user.status
            ]);
            
            console.log(`  ✅ 创建用户: ${user.email} (${user.role})`);
        }

        // 5. 检查orders表结构
        console.log('📋 检查orders表结构...');
        const [orderColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'orders'
        `);
        
        const hasOrdersTable = orderColumns.length > 0;
        if (!hasOrdersTable) {
            console.log('📋 创建orders表...');
            await connection.execute(`
                CREATE TABLE orders (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    product_id VARCHAR(36) NOT NULL,
                    adult_count INT DEFAULT 0,
                    child_count INT DEFAULT 0,
                    infant_count INT DEFAULT 0,
                    total_price DECIMAL(10,2) NOT NULL,
                    travel_date DATE NOT NULL,
                    contact_name VARCHAR(100) NOT NULL,
                    contact_phone VARCHAR(20) NOT NULL,
                    contact_email VARCHAR(100) NOT NULL,
                    special_requirements TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    payment_status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_product_id (product_id),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('  ✅ orders表创建成功');
        } else {
            console.log('  ✅ orders表已存在');
        }

        // 6. 检查price_schedules表
        console.log('📋 检查price_schedules表结构...');
        const [priceColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'price_schedules'
        `);
        
        if (priceColumns.length === 0) {
            console.log('📋 创建price_schedules表...');
            await connection.execute(`
                CREATE TABLE price_schedules (
                    id VARCHAR(36) PRIMARY KEY,
                    product_id VARCHAR(36) NOT NULL,
                    date DATE NOT NULL,
                    adult_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    child_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    infant_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    available_stock INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_product_date (product_id, date),
                    INDEX idx_product_id (product_id),
                    INDEX idx_date (date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('  ✅ price_schedules表创建成功');
        } else {
            console.log('  ✅ price_schedules表已存在');
        }

        console.log('🎉 数据库最终修复完成！');
        console.log('📋 测试账户已创建:');
        console.log('   管理员: admin@ttkh.com / admin123');
        console.log('   商家: merchant@test.com / 123456');
        console.log('   代理: agent@test.com / 123456');
        console.log('   用户: user@test.com / 123456');

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
    fixDatabaseFinal()
        .then(() => {
            console.log('✅ 数据库修复完成，可以重新运行测试');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 修复失败:', error);
            process.exit(1);
        });
}

module.exports = { fixDatabaseFinal };