const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 使用正确的数据库配置（从后端服务器获取）
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',  // 正确的密码
  database: 'ttkh_tourism'  // 正确的数据库名
};

async function fixAuthWithCorrectPassword() {
  console.log('🔧 使用正确的数据库配置修复认证问题...');
  
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查users表结构
    console.log('\n🔍 检查users表结构...');
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
    
    // 2. 清理现有测试用户
    console.log('\n🧹 清理现有测试用户...');
    await connection.execute(`DELETE FROM users WHERE email LIKE '%test.com'`);
    console.log('✅ 清理完成');
    
    // 3. 创建正确的测试用户
    console.log('\n👤 创建正确的测试用户...');
    
    const testUsers = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active',
        company_name: null,
        contact_person: '系统管理员',
        phone: null
      },
      {
        id: uuidv4(),
        username: 'testmerchant',
        email: 'merchant@test.com',
        password_hash: await bcrypt.hash('merchant123', 10),
        role: 'merchant',
        status: 'approved',
        company_name: '测试商家公司',
        contact_person: '测试商家',
        phone: '02-123-4567'
      },
      {
        id: uuidv4(),
        username: 'testagent',
        email: 'agent@test.com',
        password_hash: await bcrypt.hash('agent123', 10),
        role: 'agent',
        status: 'active',
        company_name: null,
        contact_person: '测试代理',
        phone: '02-234-5678'
      },
      {
        id: uuidv4(),
        username: 'testcustomer',
        email: 'customer@test.com',
        password_hash: await bcrypt.hash('customer123', 10),
        role: 'customer',
        status: 'active',
        company_name: null,
        contact_person: '测试客户',
        phone: '02-345-6789'
      }
    ];
    
    for (const user of testUsers) {
      try {
        await connection.execute(
          `INSERT INTO users (id, username, email, password_hash, role, status, company_name, contact_person, phone) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.username, user.email, user.password_hash, user.role, user.status, 
           user.company_name, user.contact_person, user.phone]
        );
        console.log(`✅ 创建用户: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`❌ 创建用户失败 ${user.email}: ${error.message}`);
      }
    }
    
    // 4. 验证用户创建结果
    console.log('\n✅ 验证用户创建结果...');
    const [users] = await connection.execute('SELECT id, username, email, role, status FROM users');
    console.log(`数据库中共有 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    console.log('\n🎉 认证系统修复完成！');
    console.log('现在可以使用以下账号登录:');
    console.log('  管理员: admin@test.com / admin123');
    console.log('  商家: merchant@test.com / merchant123');
    console.log('  代理: agent@test.com / agent123');
    console.log('  客户: customer@test.com / customer123');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 数据库访问被拒绝，可能的原因:');
      console.log('  1. MySQL密码不正确');
      console.log('  2. MySQL服务未启动');
      console.log('  3. 数据库不存在');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 数据库不存在，需要先创建数据库');
    }
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixAuthWithCorrectPassword().catch(console.error);