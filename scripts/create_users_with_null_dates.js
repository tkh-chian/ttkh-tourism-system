const mysql = require('mysql2/promise');

async function createUsersWithNullDates() {
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('✅ 数据库连接成功');

    // 检查MySQL的SQL模式
    const [sqlModeRows] = await connection.query("SELECT @@sql_mode");
    console.log('当前SQL模式:', sqlModeRows[0]['@@sql_mode']);

    // 临时禁用严格模式
    await connection.query("SET SESSION sql_mode = ''");
    console.log('✅ 已临时禁用严格模式');

    // 修改时间戳字段为可为空
    console.log('\n🔧 修改时间戳字段为可为空...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      MODIFY COLUMN updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ 时间戳字段已修改为可为空');

    // 清空users表
    console.log('\n🗑️ 清空users表...');
    await connection.query("DELETE FROM users");
    console.log('✅ users表已清空');

    // 使用原生SQL插入，明确指定NULL值而不是空字符串
    console.log('\n👤 创建测试用户...');
    const insertSQL = `
      INSERT INTO users 
      (id, username, email, password, role, status, name) 
      VALUES 
      (UUID(), 'null_test_user', 'null_test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'customer', 'active', '空值测试用户')
    `;
    
    await connection.query(insertSQL);
    console.log('✅ 测试用户创建成功');

    // 查询创建的用户
    console.log('\n🔍 验证创建的用户...');
    const [users] = await connection.query("SELECT * FROM users WHERE username = 'null_test_user'");
    console.log('创建的用户:', JSON.stringify(users, null, 2));

    console.log('\n✅ 用户创建成功!');

    // 提供修复建议
    console.log('\n📝 最终修复建议:');
    console.log(`
    1. 修改User.js模型:
       - 设置timestamps: false
       - 不要在模型中定义createdAt和updatedAt字段，让数据库默认值处理
       - 不要在创建用户时手动设置时间戳
    
    2. 修改authController.js:
       - 移除手动设置时间戳的代码:
         userData.createdAt = new Date();
         userData.updatedAt = new Date();
    `);

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    await connection.end();
    console.log('数据库连接已关闭');
  }
}

// 执行函数
createUsersWithNullDates();