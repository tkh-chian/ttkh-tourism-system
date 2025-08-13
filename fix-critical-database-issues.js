const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Flameaway3.',
  database: 'tourism_system'
};

async function fixCriticalDatabaseIssues() {
  console.log('🔧 修复关键数据库问题...');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 修复用户表字段问题
    await fixUsersTableFields(connection);
    
    // 2. 创建正确的测试用户
    await createCorrectTestUsers(connection);
    
    // 3. 验证修复结果
    await verifyFixes(connection);
    
    console.log('🎉 关键数据库问题修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function fixUsersTableFields(connection) {
  console.log('🔧 修复用户表字段...');
  
  try {
    // 检查当前表结构
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM users
    `);
    
    console.log('当前用户表字段:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    // 添加缺失的字段
    const fieldsToAdd = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)'
    ];
    
    for (const sql of fieldsToAdd) {
      try {
        await connection.execute(sql);
        console.log(`✅ 执行: ${sql}`);
      } catch (error) {
        if (!error.message.includes('Duplicate column')) {
          console.log(`⚠️ ${sql} - ${error.message}`);
        }
      }
    }
    
    // 如果password字段存在但password_hash不存在，复制数据
    try {
      await connection.execute(`
        UPDATE users 
        SET password_hash = password 
        WHERE password_hash IS NULL AND password IS NOT NULL
      `);
      console.log('✅ 复制密码数据到password_hash字段');
    } catch (error) {
      console.log('ℹ️ 密码数据复制可能已完成');
    }
    
    console.log('✅ 用户表字段修复完成');
    
  } catch (error) {
    console.error('❌ 用户表字段修复失败:', error.message);
  }
}

async function createCorrectTestUsers(connection) {
  console.log('👥 创建正确的测试用户...');
  
  const testUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      password_hash: 'admin123',
      role: 'admin',
      status: 'active',
      name: '系统管理员'
    },
    {
      id: 2,
      username: 'testmerchant',
      email: 'merchant@test.com',
      password: 'merchant123',
      password_hash: 'merchant123',
      role: 'merchant',
      status: 'approved',
      name: '测试商家',
      business_name: '测试旅游公司',
      business_license: 'BL123456789',
      contact_phone: '02-123-4567',
      address: '曼谷市中心商业区'
    },
    {
      id: 3,
      username: 'testagent',
      email: 'agent@test.com',
      password: 'agent123',
      password_hash: 'agent123',
      role: 'agent',
      status: 'active',
      name: '测试代理'
    },
    {
      id: 4,
      username: 'testcustomer',
      email: 'customer@test.com',
      password: 'customer123',
      password_hash: 'customer123',
      role: 'customer',
      status: 'active',
      name: '测试客户'
    }
  ];
  
  for (const user of testUsers) {
    try {
      // 先删除可能存在的用户
      await connection.execute(
        'DELETE FROM users WHERE email = ? OR username = ?',
        [user.email, user.username]
      );
      
      // 插入新用户
      await connection.execute(`
        INSERT INTO users (
          id, username, email, password, password_hash, role, status, name,
          business_name, business_license, contact_phone, address,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        user.id,
        user.username,
        user.email,
        user.password,
        user.password_hash,
        user.role,
        user.status,
        user.name,
        user.business_name || null,
        user.business_license || null,
        user.contact_phone || null,
        user.address || null
      ]);
      
      console.log(`✅ 创建用户: ${user.email} (${user.role})`);
      
    } catch (error) {
      console.error(`❌ 创建用户失败 ${user.email}:`, error.message);
    }
  }
}

async function verifyFixes(connection) {
  console.log('🔍 验证修复结果...');
  
  try {
    // 检查用户表
    const [users] = await connection.execute('SELECT id, username, email, role, status FROM users');
    console.log(`✅ 用户表有 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  ${user.id}: ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    // 检查字段是否存在
    const [columns] = await connection.execute('SHOW COLUMNS FROM users');
    const fieldNames = columns.map(col => col.Field);
    
    const requiredFields = ['password_hash', 'company_name', 'contact_person', 'phone'];
    const missingFields = requiredFields.filter(field => !fieldNames.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ 所有必需字段都存在');
    } else {
      console.log('⚠️ 缺失字段:', missingFields.join(', '));
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

// 运行修复
fixCriticalDatabaseIssues().catch(console.error);