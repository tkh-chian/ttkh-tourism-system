const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 使用正确的数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixPasswordFieldFinal() {
  console.log('🔧 修复密码字段问题并创建测试用户...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查当前表结构
    console.log('\n🔍 检查当前users表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('当前字段:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // 2. 添加password_hash字段（如果不存在）
    console.log('\n🔧 添加password_hash字段...');
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL
      `);
      console.log('✅ 成功添加password_hash字段');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ password_hash字段已存在');
      } else {
        console.log('❌ 添加password_hash字段失败:', error.message);
      }
    }
    
    // 3. 清理现有测试用户
    console.log('\n🧹 清理现有测试用户...');
    await connection.execute(`DELETE FROM users WHERE email LIKE '%test.com'`);
    console.log('✅ 清理完成');
    
    // 4. 创建正确的测试用户（使用password字段）
    console.log('\n👤 创建正确的测试用户...');
    
    const testUsers = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@test.com',
        password: await bcrypt.hash('admin123', 10),
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active',
        name: '系统管理员',
        company_name: null,
        contact_person: '系统管理员',
        phone: null
      },
      {
        id: uuidv4(),
        username: 'testmerchant',
        email: 'merchant@test.com',
        password: await bcrypt.hash('merchant123', 10),
        password_hash: await bcrypt.hash('merchant123', 10),
        role: 'merchant',
        status: 'approved',
        name: '测试商家',
        company_name: '测试商家公司',
        contact_person: '测试商家',
        phone: '02-123-4567'
      },
      {
        id: uuidv4(),
        username: 'testagent',
        email: 'agent@test.com',
        password: await bcrypt.hash('agent123', 10),
        password_hash: await bcrypt.hash('agent123', 10),
        role: 'agent',
        status: 'active',
        name: '测试代理',
        company_name: null,
        contact_person: '测试代理',
        phone: '02-234-5678'
      },
      {
        id: uuidv4(),
        username: 'testcustomer',
        email: 'customer@test.com',
        password: await bcrypt.hash('customer123', 10),
        password_hash: await bcrypt.hash('customer123', 10),
        role: 'customer',
        status: 'active',
        name: '测试客户',
        company_name: null,
        contact_person: '测试客户',
        phone: '02-345-6789'
      }
    ];
    
    for (const user of testUsers) {
      try {
        await connection.execute(
          `INSERT INTO users (id, username, email, password, password_hash, role, status, name, company_name, contact_person, phone) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.username, user.email, user.password, user.password_hash, user.role, user.status, 
           user.name, user.company_name, user.contact_person, user.phone]
        );
        console.log(`✅ 创建用户: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`❌ 创建用户失败 ${user.email}: ${error.message}`);
      }
    }
    
    // 5. 验证用户创建结果
    console.log('\n✅ 验证用户创建结果...');
    const [users] = await connection.execute(`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE email LIKE '%test.com'
    `);
    
    console.log(`成功创建 ${users.length} 个测试用户:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    // 6. 测试登录功能
    console.log('\n🔑 测试登录功能...');
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3001';
    
    for (const testUser of users) {
      try {
        const password = testUser.email.includes('admin') ? 'admin123' :
                        testUser.email.includes('merchant') ? 'merchant123' :
                        testUser.email.includes('agent') ? 'agent123' : 'customer123';
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: testUser.email,
          password: password
        });
        
        if (response.data.success && response.data.data.token) {
          console.log(`✅ ${testUser.role}登录成功: ${testUser.email}`);
        } else {
          console.log(`❌ ${testUser.role}登录失败: 无效响应`);
        }
        
      } catch (error) {
        console.log(`❌ ${testUser.role}登录失败: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n🎉 密码字段修复和测试用户创建完成！');
    console.log('\n📋 可用测试账号:');
    console.log('  管理员: admin@test.com / admin123');
    console.log('  商家: merchant@test.com / merchant123');
    console.log('  代理: agent@test.com / agent123');
    console.log('  客户: customer@test.com / customer123');
    
    console.log('\n🎯 系统现在应该可以正常登录了！');
    console.log('  前端地址: http://localhost:3000');
    console.log('  后端地址: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixPasswordFieldFinal().catch(console.error);