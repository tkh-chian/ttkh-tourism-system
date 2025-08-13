const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function createMySQLTestUsers() {
  let connection;
  
  try {
    // 创建连接
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ MySQL数据库连接成功');

    // 检查现有用户
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`📊 当前用户数量: ${existingUsers[0].count}`);

    // 测试用户数据
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@ttkh.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      },
      {
        username: 'merchant',
        email: 'merchant@ttkh.com',
        password: 'merchant123',
        role: 'merchant',
        status: 'active'
      },
      {
        username: 'agent',
        email: 'agent@ttkh.com',
        password: 'agent123',
        role: 'agent',
        status: 'active'
      },
      {
        username: 'user',
        email: 'user@ttkh.com',
        password: 'user123',
        role: 'user',
        status: 'active'
      }
    ];

    for (const userData of testUsers) {
      try {
        // 检查用户是否已存在
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [userData.username, userData.email]
        );

        if (existing.length === 0) {
          // 加密密码
          const hashedPassword = bcrypt.hashSync(userData.password, 12);
          
          // 插入新用户
          await connection.execute(`
            INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            userData.username,
            userData.email,
            hashedPassword,
            userData.role,
            userData.status
          ]);
          
          console.log(`✅ 创建用户: ${userData.username} (${userData.role})`);
        } else {
          // 更新现有用户密码
          const hashedPassword = bcrypt.hashSync(userData.password, 12);
          await connection.execute(`
            UPDATE users SET password_hash = ?, updated_at = NOW()
            WHERE username = ? OR email = ?
          `, [hashedPassword, userData.username, userData.email]);
          
          console.log(`🔄 更新用户密码: ${userData.username}`);
        }
      } catch (error) {
        console.error(`❌ 处理用户失败 ${userData.username}:`, error.message);
      }
    }

    // 显示所有用户
    const [allUsers] = await connection.execute(`
      SELECT username, email, role, status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 MySQL数据库用户列表:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
    });

    console.log('\n🎉 MySQL测试用户创建/更新完成！');
    console.log('\n🔑 登录信息:');
    console.log('  管理员: admin / admin123');
    console.log('  商家: merchant / merchant123');
    console.log('  代理: agent / agent123');
    console.log('  用户: user / user123');
    
  } catch (error) {
    console.error('❌ 创建MySQL测试用户失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createMySQLTestUsers();