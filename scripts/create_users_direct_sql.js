const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function createUsersDirectSQL() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查表结构
    console.log('\n📊 检查users表结构...');
    const [columns] = await connection.execute("SHOW COLUMNS FROM users");
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}, ${col.Null === 'YES' ? '允许NULL' : '不允许NULL'}, 默认值: ${col.Default || 'NULL'}, 额外: ${col.Extra || 'N/A'}`);
    });

    // 2. 清空表
    console.log('\n🗑️ 清空users表...');
    await connection.execute('DELETE FROM users');
    console.log('✅ users表已清空');

    // 3. 创建测试用户（使用完全明确的SQL，包括所有必要字段）
    console.log('\n👤 创建测试用户...');
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 使用完全明确的SQL，不使用参数化查询
    const createUserSQL = `
    INSERT INTO users 
      (id, username, email, password, role, name, status, createdAt, updatedAt) 
    VALUES 
      (UUID(), 'admin', 'admin@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'admin', '管理员', 'active', '${currentTime}', '${currentTime}'),
      (UUID(), 'merchant', 'merchant@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'merchant', '商家用户', 'active', '${currentTime}', '${currentTime}'),
      (UUID(), 'user', 'user@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'customer', '普通用户', 'active', '${currentTime}', '${currentTime}')
    `;

    try {
      await connection.query(createUserSQL);
      console.log('✅ 测试用户创建成功');
    } catch (err) {
      console.error('❌ 创建用户失败:', err.message);
      
      // 尝试单独插入每个用户
      console.log('\n尝试单独插入每个用户...');
      
      const singleUserSQLs = [
        `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
         VALUES (UUID(), 'admin', 'admin@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'admin', '管理员', 'active', '${currentTime}', '${currentTime}')`,
        
        `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
         VALUES (UUID(), 'merchant', 'merchant@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'merchant', '商家用户', 'active', '${currentTime}', '${currentTime}')`,
        
        `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
         VALUES (UUID(), 'user', 'user@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'customer', '普通用户', 'active', '${currentTime}', '${currentTime}')`
      ];
      
      for (const [index, sql] of singleUserSQLs.entries()) {
        try {
          await connection.query(sql);
          console.log(`✅ 用户 ${index + 1} 创建成功`);
        } catch (err) {
          console.error(`❌ 用户 ${index + 1} 创建失败:`, err.message);
        }
      }
    }

    // 4. 验证用户创建
    const [users] = await connection.execute('SELECT id, email, role, createdAt, updatedAt FROM users');
    console.log('\n📋 创建的用户:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ID=${user.id}, 创建时间=${user.createdAt}, 更新时间=${user.updatedAt}`);
    });

    console.log('\n✅ 用户创建完成!');
    
  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行创建用户
createUsersDirectSQL();