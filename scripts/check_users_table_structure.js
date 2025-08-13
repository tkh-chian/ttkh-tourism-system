const mysql = require('mysql2/promise');

async function checkUsersTable() {
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

    // 检查 users 表的索引
    console.log('\n📑 检查 users 表索引...');
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM users
    `);

    indexes.forEach(idx => {
      console.log(`- ${idx.Key_name}: 列=${idx.Column_name}, 唯一=${idx.Non_unique ? '否' : '是'}`);
    });

    // 检查 SQL 模式
    console.log('\n⚙️ 检查 SQL 模式...');
    const [sqlMode] = await connection.execute(`
      SELECT @@sql_mode
    `);
    console.log(`当前 SQL 模式: ${sqlMode[0]['@@sql_mode']}`);

    // 检查时区设置
    console.log('\n🕒 检查时区设置...');
    const [timezone] = await connection.execute(`
      SELECT @@time_zone, @@system_time_zone
    `);
    console.log(`当前时区: ${timezone[0]['@@time_zone']}, 系统时区: ${timezone[0]['@@system_time_zone']}`);

    // 检查 users 表中的一条记录
    console.log('\n👤 检查 users 表中的一条记录...');
    const [users] = await connection.execute(`
      SELECT * FROM users LIMIT 1
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('用户记录示例:');
      Object.keys(user).forEach(key => {
        console.log(`- ${key}: ${user[key] !== null ? (typeof user[key] === 'object' ? JSON.stringify(user[key]) : user[key]) : 'NULL'}`);
      });
    } else {
      console.log('users 表中没有记录');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行检查
checkUsersTable();