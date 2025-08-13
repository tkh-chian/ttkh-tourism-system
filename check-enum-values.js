const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function checkEnumValues() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查users表的枚举值
    console.log('\n📋 检查users表的枚举值...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'users' 
      AND DATA_TYPE = 'enum'
    `);
    
    console.log('枚举字段详情:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // 检查现有用户的status值
    console.log('\n👥 检查现有用户的status值...');
    const [users] = await connection.execute(`
      SELECT username, role, status FROM users LIMIT 10
    `);
    
    if (users.length > 0) {
      console.log('现有用户状态:');
      users.forEach(user => {
        console.log(`  ${user.username}: role=${user.role}, status=${user.status}`);
      });
    } else {
      console.log('没有现有用户');
    }

    return true;

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEnumValues().catch(console.error);