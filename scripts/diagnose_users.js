const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function diagnoseUsersTable() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查MySQL版本和配置
    console.log('\n📊 MySQL版本和配置:');
    const [versionResult] = await connection.execute('SELECT VERSION() as version');
    console.log(`MySQL版本: ${versionResult[0].version}`);
    
    const [modeResult] = await connection.execute('SELECT @@SESSION.sql_mode');
    console.log(`当前SQL模式: ${modeResult[0]['@@SESSION.sql_mode']}`);
    
    const [timeZoneResult] = await connection.execute('SELECT @@session.time_zone');
    console.log(`时区设置: ${timeZoneResult[0]['@@session.time_zone']}`);

    // 2. 检查users表结构
    console.log('\n📊 users表结构:');
    const [columns] = await connection.execute("DESCRIBE users");
    console.log('字段列表:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}, ${col.Null === 'YES' ? '允许NULL' : '不允许NULL'}, 默认值: ${col.Default || 'NULL'}, 额外: ${col.Extra || 'N/A'}`);
    });

    // 3. 检查是否存在重复的时间戳字段
    const timestampFields = columns.filter(col => 
      ['created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(col.Field)
    );
    
    if (timestampFields.length > 2) {
      console.log('\n⚠️ 警告: 检测到重复的时间戳字段!');
      console.log('时间戳字段:');
      timestampFields.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}, ${col.Null === 'YES' ? '允许NULL' : '不允许NULL'}, 默认值: ${col.Default || 'NULL'}, 额外: ${col.Extra || 'N/A'}`);
      });
    }

    // 4. 检查表的索引
    console.log('\n📊 users表索引:');
    const [indexes] = await connection.execute("SHOW INDEX FROM users");
    indexes.forEach(idx => {
      console.log(`- ${idx.Key_name}: 列=${idx.Column_name}, 唯一=${idx.Non_unique === 0 ? '是' : '否'}`);
    });

    // 5. 检查表的触发器
    console.log('\n📊 users表触发器:');
    const [triggers] = await connection.execute("SHOW TRIGGERS WHERE `table` = 'users'");
    if (triggers.length === 0) {
      console.log('没有触发器');
    } else {
      triggers.forEach(trg => {
        console.log(`- ${trg.Trigger}: ${trg.Timing} ${trg.Event}`);
        console.log(`  语句: ${trg.Statement}`);
      });
    }

    // 6. 尝试读取Sequelize模型定义
    console.log('\n📊 尝试读取Sequelize User模型:');
    try {
      const userModelPath = path.join(process.cwd(), 'ttkh-tourism-system', 'backend', 'models', 'User.js');
      const modelContent = await fs.readFile(userModelPath, 'utf8');
      console.log('User模型内容:');
      console.log(modelContent);
    } catch (err) {
      console.error(`无法读取User模型: ${err.message}`);
    }

    // 7. 尝试一个简单的插入测试
    console.log('\n🧪 尝试简单插入测试:');
    
    // 先禁用严格模式
    await connection.execute("SET SESSION sql_mode=''");
    console.log('已禁用严格模式');
    
    // 尝试不同的插入方式
    const testInserts = [
      // 测试1: 不指定时间戳字段
      "INSERT INTO users (id, username, email, password, role, name, status) VALUES (UUID(), 'test1', 'test1@example.com', 'password', 'customer', 'Test User 1', 'active')",
      
      // 测试2: 指定NULL作为时间戳
      "INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) VALUES (UUID(), 'test2', 'test2@example.com', 'password', 'customer', 'Test User 2', 'active', NULL, NULL)",
      
      // 测试3: 指定当前时间戳
      `INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) VALUES (UUID(), 'test3', 'test3@example.com', 'password', 'customer', 'Test User 3', 'active', NOW(), NOW())`,
      
      // 测试4: 使用CURRENT_TIMESTAMP函数
      "INSERT INTO users (id, username, email, password, role, name, status, createdAt, updatedAt) VALUES (UUID(), 'test4', 'test4@example.com', 'password', 'customer', 'Test User 4', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    ];
    
    for (const [index, query] of testInserts.entries()) {
      try {
        await connection.execute(query);
        console.log(`✅ 测试${index + 1}成功: ${query.substring(0, 50)}...`);
      } catch (err) {
        console.error(`❌ 测试${index + 1}失败: ${query.substring(0, 50)}...`, err.message);
      }
    }
    
    // 检查插入结果
    const [insertedUsers] = await connection.execute('SELECT id, email, createdAt, updatedAt FROM users');
    console.log('\n📋 插入的测试用户:');
    insertedUsers.forEach(user => {
      console.log(`- ${user.email}: createdAt=${user.createdAt}, updatedAt=${user.updatedAt}`);
    });

    console.log('\n✅ 诊断完成!');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行诊断
diagnoseUsersTable();