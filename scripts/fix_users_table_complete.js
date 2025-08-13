const { Sequelize } = require('sequelize');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism',
  dialect: 'mysql'
};

async function fixUsersTable() {
  // 创建 Sequelize 实例
  const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  });

  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('\n📊 修复 users 表结构...');

    // 1. 确保 password_hash 字段与 password 字段的关系正确
    console.log('\n1️⃣ 确保 password_hash 字段设置正确...');
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT '密码哈希，与 password 字段同步'
    `);
    console.log('✅ password_hash 字段已更新');

    // 2. 修复时间戳字段，使其与 Sequelize 模型兼容
    console.log('\n2️⃣ 修复时间戳字段...');
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      MODIFY COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ 时间戳字段已修复');

    // 3. 创建一个测试用户，验证修复是否成功
    console.log('\n3️⃣ 创建测试用户验证修复...');
    const testUserResult = await sequelize.query(`
      INSERT INTO users (
        id, 
        username, 
        email, 
        password, 
        role, 
        status, 
        name
      ) VALUES (
        UUID(), 
        'test_fix_user', 
        'test_fix@example.com', 
        '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 
        'customer', 
        'active', 
        '修复测试用户'
      )
    `, { type: sequelize.QueryTypes.INSERT });
    
    console.log('✅ 测试用户创建成功:', testUserResult);

    // 4. 查询创建的用户，验证时间戳是否正确设置
    console.log('\n4️⃣ 验证创建的用户...');
    const [users] = await sequelize.query(`
      SELECT id, username, email, role, createdAt, updatedAt 
      FROM users 
      WHERE username = 'test_fix_user'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 创建的测试用户:', users);

    console.log('\n✅ users 表修复完成!');

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行修复
fixUsersTable();