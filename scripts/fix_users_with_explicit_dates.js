const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixUsersTable() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查表中的记录数
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`当前 users 表中有 ${countResult[0].total} 条记录`);

    // 2. 修改表结构，确保 createdAt 和 updatedAt 有默认值
    console.log('🔧 修改表结构...');
    try {
      await connection.execute("ALTER TABLE users MODIFY createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
      await connection.execute("ALTER TABLE users MODIFY updatedAt DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");
      console.log('✅ 表结构已修改');
    } catch (err) {
      console.error('❌ 修改表结构失败:', err.message);
    }

    // 3. 创建测试用户
    console.log('👤 创建测试用户...');
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const testUsers = [
      { email: 'admin@test.com', password: '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', role: 'admin', name: '管理员', username: 'admin' },
      { email: 'merchant@test.com', password: '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', role: 'merchant', name: '商家用户', username: 'merchant' },
      { email: 'user@test.com', password: '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', role: 'customer', name: '普通用户', username: 'user' }
    ];

    for (const user of testUsers) {
      try {
        await connection.execute(
          'INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, "active", ?, ?)',
          [user.username, user.email, user.password, user.role, user.name, currentTime, currentTime]
        );
        console.log(`✅ 创建用户: ${user.email} (${user.role})`);
      } catch (err) {
        console.error(`❌ 创建用户 ${user.email} 失败:`, err.message);
      }
    }

    // 4. 验证用户创建
    const [users] = await connection.execute('SELECT id, email, role, createdAt, updatedAt FROM users');
    console.log('\n📋 创建的用户:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ID=${user.id}, 创建时间=${user.createdAt}, 更新时间=${user.updatedAt}`);
    });

    console.log('\n✅ users 表修复完成!');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行修复
fixUsersTable();