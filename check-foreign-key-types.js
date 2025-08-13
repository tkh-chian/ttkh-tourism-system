const mysql = require('mysql2/promise');

async function checkForeignKeyTypes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔍 检查users表的id字段类型...');
    const [usersResult] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'id'
    `);
    console.log('users.id字段信息:', usersResult);

    console.log('\n🔍 检查orders表的user_id字段类型...');
    const [ordersResult] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'user_id'
    `);
    console.log('orders.user_id字段信息:', ordersResult);

    console.log('\n🔍 检查orders表是否存在...');
    const [tablesResult] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'orders'
    `);
    console.log('orders表存在:', tablesResult.length > 0);

    if (tablesResult.length === 0) {
      console.log('\n📝 orders表不存在，这是正常的，Sequelize会创建它');
    }

    console.log('\n🔍 检查现有的外键约束...');
    const [constraintsResult] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND (TABLE_NAME = 'orders' OR REFERENCED_TABLE_NAME = 'users')
    `);
    console.log('相关外键约束:', constraintsResult);

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkForeignKeyTypes();