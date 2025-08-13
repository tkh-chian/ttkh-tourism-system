const mysql = require('mysql2/promise');

async function applyUsersTrigger() {
  // 数据库配置
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  };

  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查 users 表结构
    console.log('\n📊 检查 users 表结构...');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT, 
        EXTRA
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = '${dbConfig.database}' 
        AND TABLE_NAME = 'users'
      ORDER BY 
        ORDINAL_POSITION
    `);

    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '不允许NULL' : '允许NULL'} 默认值: ${col.COLUMN_DEFAULT || 'NULL'} 额外: ${col.EXTRA || 'N/A'}`);
    });

    // 检查是否存在触发器
    console.log('\n🔍 检查现有触发器...');
    const [triggers] = await connection.execute(`
      SHOW TRIGGERS WHERE \`Table\` = 'users'
    `);

    if (triggers.length > 0) {
      console.log('发现以下触发器:');
      triggers.forEach(trigger => {
        console.log(`- ${trigger.Trigger}: ${trigger.Event} ${trigger.Timing}`);
      });

      // 删除现有触发器
      console.log('\n🗑️ 删除现有触发器...');
      for (const trigger of triggers) {
        await connection.execute(`DROP TRIGGER IF EXISTS ${trigger.Trigger}`);
        console.log(`✅ 已删除触发器: ${trigger.Trigger}`);
      }
    } else {
      console.log('没有发现现有触发器');
    }

    // 创建新的触发器
    console.log('\n🔧 创建新的触发器...');
    
    // 创建 BEFORE INSERT 触发器，自动填充 createdAt 和 updatedAt
    await connection.execute(`
      CREATE TRIGGER before_users_insert
      BEFORE INSERT ON users
      FOR EACH ROW
      BEGIN
        IF NEW.createdAt IS NULL OR NEW.createdAt = '' THEN
          SET NEW.createdAt = NOW();
        END IF;
        IF NEW.updatedAt IS NULL OR NEW.updatedAt = '' THEN
          SET NEW.updatedAt = NOW();
        END IF;
      END
    `);
    console.log('✅ 已创建 BEFORE INSERT 触发器');

    // 创建 BEFORE UPDATE 触发器，自动更新 updatedAt
    await connection.execute(`
      CREATE TRIGGER before_users_update
      BEFORE UPDATE ON users
      FOR EACH ROW
      BEGIN
        SET NEW.updatedAt = NOW();
      END
    `);
    console.log('✅ 已创建 BEFORE UPDATE 触发器');

    // 修改表结构，确保 createdAt 和 updatedAt 允许为 NULL
    console.log('\n🔧 修改表结构，确保时间戳字段允许为 NULL...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NULL,
      MODIFY COLUMN updatedAt DATETIME NULL
    `);
    console.log('✅ 已修改表结构');

    // 测试创建用户
    console.log('\n👤 测试创建用户...');
    await connection.execute(`
      INSERT INTO users 
      (id, username, email, password, role, status, name) 
      VALUES 
      (UUID(), 'testadmin', 'testadmin@example.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC', 'admin', 'active', '测试管理员')
    `);
    console.log('✅ 测试用户创建成功');

    // 验证用户创建
    const [users] = await connection.execute(`
      SELECT id, username, email, role, createdAt, updatedAt 
      FROM users 
      WHERE username = 'testadmin'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log(`\n📋 创建的用户: ${user.username} (${user.role})`);
      console.log(`- ID: ${user.id}`);
      console.log(`- 创建时间: ${user.createdAt}`);
      console.log(`- 更新时间: ${user.updatedAt}`);
    } else {
      console.log('❌ 未找到创建的用户');
    }

    console.log('\n✅ 触发器应用完成!');

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行应用触发器
applyUsersTrigger();