const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function createTestUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接到MySQL数据库');

    // 创建管理员账户
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, username, email, password_hash, role, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [adminId, '系统管理员', 'admin@ttkh.com', adminPassword, 'admin', 'approved']);
    console.log('✅ 创建管理员账户: admin@ttkh.com / admin123');

    // 创建测试商家账户
    const merchantId = uuidv4();
    const merchantPassword = await bcrypt.hash('123456', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, username, email, password_hash, role, company_name, contact_person, phone, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [merchantId, '测试旅行社', 'merchant@test.com', merchantPassword, 'merchant', '测试旅行社有限公司', '张经理', '0123456789', 'approved']);
    console.log('✅ 创建商家账户: merchant@test.com / 123456');

    // 创建测试客户账户
    const customerId = uuidv4();
    const customerPassword = await bcrypt.hash('123456', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, username, email, password_hash, role, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [customerId, '测试客户', 'customer@test.com', customerPassword, 'customer', 'approved']);
    console.log('✅ 创建客户账户: customer@test.com / 123456');

    // 验证创建结果
    const [users] = await connection.execute('SELECT username, email, role, status FROM users ORDER BY role');
    console.log('\n📋 当前用户列表:');
    users.forEach(user => {
      console.log(`  ${user.role.padEnd(8)} | ${user.email.padEnd(20)} | ${user.username} | ${user.status}`);
    });

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ 数据库连接已关闭');
    }
  }
}

createTestUsers();