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

    // 1. 检查并修改MySQL会话模式
    console.log('🔧 检查MySQL会话模式...');
    const [modeResult] = await connection.execute('SELECT @@SESSION.sql_mode');
    console.log(`当前SQL模式: ${modeResult[0]['@@SESSION.sql_mode']}`);
    
    // 设置为非严格模式
    await connection.execute("SET SESSION sql_mode=''");
    const [newModeResult] = await connection.execute('SELECT @@SESSION.sql_mode');
    console.log(`修改后SQL模式: ${newModeResult[0]['@@SESSION.sql_mode']}`);

    // 2. 检查表结构
    console.log('\n📊 检查users表结构...');
    const [columns] = await connection.execute("SHOW COLUMNS FROM users");
    const createdAtColumn = columns.find(col => col.Field === 'createdAt');
    const updatedAtColumn = columns.find(col => col.Field === 'updatedAt');
    
    console.log(`createdAt列: ${JSON.stringify(createdAtColumn)}`);
    console.log(`updatedAt列: ${JSON.stringify(updatedAtColumn)}`);

    // 3. 修改表结构，确保时间戳字段允许NULL且有默认值
    console.log('\n🔧 修改表结构...');
    try {
      // 先删除可能存在的默认值约束
      await connection.execute("ALTER TABLE users MODIFY createdAt DATETIME NULL");
      await connection.execute("ALTER TABLE users MODIFY updatedAt DATETIME NULL");
      
      // 然后添加新的默认值
      await connection.execute("ALTER TABLE users MODIFY createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
      await connection.execute("ALTER TABLE users MODIFY updatedAt DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP");
      
      console.log('✅ 表结构已修改');
      
      // 再次检查表结构
      const [newColumns] = await connection.execute("SHOW COLUMNS FROM users");
      const newCreatedAtColumn = newColumns.find(col => col.Field === 'createdAt');
      const newUpdatedAtColumn = newColumns.find(col => col.Field === 'updatedAt');
      
      console.log(`修改后createdAt列: ${JSON.stringify(newCreatedAtColumn)}`);
      console.log(`修改后updatedAt列: ${JSON.stringify(newUpdatedAtColumn)}`);
    } catch (err) {
      console.error('❌ 修改表结构失败:', err.message);
    }

    // 4. 清空表并使用原始SQL创建测试用户
    console.log('\n🗑️ 清空users表...');
    await connection.execute('DELETE FROM users');
    console.log('✅ users表已清空');

    // 5. 创建测试用户（使用原始SQL，不通过参数化查询）
    console.log('\n👤 创建测试用户...');
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const createUserQueries = [
      `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
       VALUES (UUID(), 'admin', 'admin@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'admin', '管理员', 'active', '${currentTime}', '${currentTime}')`,
      
      `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
       VALUES (UUID(), 'merchant', 'merchant@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'merchant', '商家用户', 'active', '${currentTime}', '${currentTime}')`,
      
      `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) 
       VALUES (UUID(), 'user', 'user@test.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'customer', '普通用户', 'active', '${currentTime}', '${currentTime}')`
    ];

    for (const query of createUserQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ 执行SQL: ${query.substring(0, 50)}...`);
      } catch (err) {
        console.error(`❌ SQL执行失败: ${query.substring(0, 50)}...`, err.message);
      }
    }

    // 6. 验证用户创建
    const [users] = await connection.execute('SELECT id, email, role, createdAt, updatedAt FROM users');
    console.log('\n📋 创建的用户:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ID=${user.id}, 创建时间=${user.createdAt}, 更新时间=${user.updatedAt}`);
    });

    console.log('\n✅ users表修复完成!');
    
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