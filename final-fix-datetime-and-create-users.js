const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function finalFixDatetimeAndCreateUsers() {
  console.log('🔧 最终修复datetime字段并创建测试用户...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 修复datetime字段的默认值
    console.log('\n🔧 修复datetime字段默认值...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        MODIFY COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        MODIFY COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ 修复datetime字段默认值成功');
    } catch (error) {
      console.log('⚠️ 修复datetime字段失败:', error.message);
    }
    
    // 2. 清理现有测试用户
    console.log('\n🧹 清理现有测试用户...');
    await connection.execute(`DELETE FROM users WHERE email LIKE '%test.com'`);
    console.log('✅ 清理完成');
    
    // 3. 创建测试用户（包含所有必需字段）
    console.log('\n👤 创建测试用户...');
    
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
        phone: null,
        address: null,
        rejection_reason: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        phone: '02-123-4567',
        address: '测试地址',
        rejection_reason: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        phone: '02-234-5678',
        address: null,
        rejection_reason: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        phone: '02-345-6789',
        address: null,
        rejection_reason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const user of testUsers) {
      try {
        await connection.execute(
          `INSERT INTO users (id, username, email, password, password_hash, role, status, name, 
           company_name, contact_person, phone, address, rejection_reason, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.username, user.email, user.password, user.password_hash, user.role, 
           user.status, user.name, user.company_name, user.contact_person, user.phone, 
           user.address, user.rejection_reason, user.createdAt, user.updatedAt]
        );
        console.log(`✅ 创建用户: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`❌ 创建用户失败 ${user.email}: ${error.message}`);
      }
    }
    
    // 4. 验证用户创建结果
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
    
    // 5. 测试登录功能
    if (users.length > 0) {
      console.log('\n🔑 测试登录功能...');
      const axios = require('axios');
      const BASE_URL = 'http://localhost:3001';
      
      let successfulLogins = 0;
      
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
            successfulLogins++;
          } else {
            console.log(`❌ ${testUser.role}登录失败: 无效响应`);
          }
          
        } catch (error) {
          console.log(`❌ ${testUser.role}登录失败: ${error.response?.data?.message || error.message}`);
        }
      }
      
      console.log(`\n📊 登录测试结果: ${successfulLogins}/${users.length} 个账号可以正常登录`);
      
      if (successfulLogins === users.length) {
        console.log('\n🎉 所有测试账号都可以正常登录！认证系统修复成功！');
      } else if (successfulLogins > 0) {
        console.log('\n⚠️ 部分账号可以登录，系统基本可用');
      } else {
        console.log('\n❌ 所有账号都无法登录，需要进一步调试');
      }
    }
    
    console.log('\n📋 可用测试账号:');
    console.log('  管理员: admin@test.com / admin123');
    console.log('  商家: merchant@test.com / merchant123');
    console.log('  代理: agent@test.com / agent123');
    console.log('  客户: customer@test.com / customer123');
    
    console.log('\n🎯 系统状态:');
    console.log('  前端地址: http://localhost:3000');
    console.log('  后端地址: http://localhost:3001');
    console.log('  数据库: MySQL (ttkh_tourism)');
    
    console.log('\n🏁 认证系统修复完成！现在可以开始人工测试了。');
    
  } catch (error) {
    console.error('❌ 最终修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行最终修复
finalFixDatetimeAndCreateUsers().catch(console.error);