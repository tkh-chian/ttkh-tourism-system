const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Lhjr@170103',
    database: process.env.DB_NAME || 'ttkh_tourism',
    charset: 'utf8mb4'
};

async function fixDatabaseStructure() {
    let connection;
    
    try {
        console.log('🔧 开始修复数据库结构...');
        
        // 连接数据库
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');

        // 1. 修复 users 表结构
        console.log('📋 修复 users 表结构...');
        
        // 检查并添加缺失的列
        const userColumns = [
            "ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NOT NULL DEFAULT ''",
            "ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
            "ADD COLUMN IF NOT EXISTS `name` VARCHAR(100) DEFAULT NULL"
        ];

        for (const column of userColumns) {
            try {
                await connection.execute(`ALTER TABLE users ${column}`);
                console.log(`  ✅ 添加列: ${column}`);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.log(`  ⚠️  列可能已存在: ${column}`);
                }
            }
        }

        // 2. 修复 products 表结构
        console.log('📋 修复 products 表结构...');
        
        const productColumns = [
            "ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ];

        for (const column of productColumns) {
            try {
                await connection.execute(`ALTER TABLE products ${column}`);
                console.log(`  ✅ 添加列: ${column}`);
            } catch (error) {
                if (!error.message.includes('Duplicate column name')) {
                    console.log(`  ⚠️  列可能已存在: ${column}`);
                }
            }
        }

        // 3. 修复 orders 表结构
        console.log('📋 修复 orders 表结构...');
        
        // 检查 orders 表是否存在，如果不存在则创建
        const [ordersTables] = await connection.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'orders'",
            [dbConfig.database]
        );

        if (ordersTables[0].count === 0) {
            console.log('  📋 创建 orders 表...');
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
                    INDEX idx_status (status),
                    INDEX idx_travel_date (travel_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('  ✅ orders 表创建成功');
        } else {
            console.log('  ✅ orders 表已存在');
            
            // 确保 orders 表有正确的字段类型
            try {
                await connection.execute(`ALTER TABLE orders MODIFY COLUMN id VARCHAR(36)`);
                await connection.execute(`ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending'`);
                console.log('  ✅ orders 表字段类型修复完成');
            } catch (error) {
                console.log('  ⚠️  orders 表字段可能已是正确类型');
            }
        }

        // 4. 修复 price_schedules 表结构
        console.log('📋 修复 price_schedules 表结构...');
        
        const [priceSchedulesTables] = await connection.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'price_schedules'",
            [dbConfig.database]
        );

        if (priceSchedulesTables[0].count === 0) {
            console.log('  📋 创建 price_schedules 表...');
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
            console.log('  ✅ price_schedules 表创建成功');
        } else {
            console.log('  ✅ price_schedules 表已存在');
        }

        // 5. 创建测试用户数据
        console.log('📋 创建测试用户数据...');
        
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        
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

        // 清空现有测试用户
        await connection.execute("DELETE FROM users WHERE email IN ('admin@ttkh.com', 'merchant@test.com', 'agent@test.com', 'user@test.com')");

        // 插入测试用户
        for (const user of testUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            await connection.execute(`
                INSERT INTO users (
                    id, username, email, password_hash, role, name, 
                    company_name, contact_person, phone, status, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
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

        console.log('🎉 数据库结构修复完成！');
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
    fixDatabaseStructure()
        .then(() => {
            console.log('✅ 数据库修复完成，可以重新运行测试');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 修复失败:', error);
            process.exit(1);
        });
}

module.exports = { fixDatabaseStructure };