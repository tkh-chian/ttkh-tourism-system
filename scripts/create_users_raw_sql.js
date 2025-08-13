const mysql = require('mysql2/promise');

async function createUsersWithRawSQL() {
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

    // 检查users表结构
    const [tableInfo] = await connection.query("DESCRIBE users");
    console.log('表结构:', JSON.stringify(tableInfo, null, 2));

    // 清空users表
    console.log('\n🗑️ 清空users表...');
    await connection.query("DELETE FROM users");
    console.log('✅ users表已清空');

    // 使用最原始的SQL插入语句，明确指定所有字段
    console.log('\n👤 创建测试用户...');
    const insertSQL = `
      INSERT INTO users 
      (id, username, email, password, role, status, name, createdAt, updatedAt) 
      VALUES 
      (UUID(), 'raw_test_user', 'raw_test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'customer', 'active', '原始SQL测试用户', NOW(), NOW())
    `;
    
    await connection.query(insertSQL);
    console.log('✅ 测试用户创建成功');

    // 查询创建的用户
    console.log('\n🔍 验证创建的用户...');
    const [users] = await connection.query("SELECT * FROM users WHERE username = 'raw_test_user'");
    console.log('创建的用户:', JSON.stringify(users, null, 2));

    console.log('\n✅ 用户创建成功!');

    // 提供修复建议
    console.log('\n📝 修复建议:');
    console.log(`
    1. 修改User.js模型:
       - 设置timestamps: false
       - 在模型中明确定义createdAt和updatedAt字段，但设置allowNull: true
       - 在创建用户时不要手动设置时间戳，让数据库默认值处理
    
    2. 修改authController.js:
       - 移除手动设置时间戳的代码
       - 确保password_hash字段与password字段的映射关系正确
    `);

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    await connection.end();
    console.log('数据库连接已关闭');
  }
}

// 执行函数
createUsersWithRawSQL();