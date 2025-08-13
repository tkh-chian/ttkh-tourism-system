const mysql = require('mysql2/promise');

async function fixDatabaseDefaults() {
  let connection;
  
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 修复 users 表的 created_at 字段
    console.log('🔧 修复 users 表 created_at 字段...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // 修复 users 表的 updated_at 字段
    console.log('🔧 修复 users 表 updated_at 字段...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    // 修复 products 表的 created_at 字段
    console.log('🔧 修复 products 表 created_at 字段...');
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // 修复 products 表的 updated_at 字段
    console.log('🔧 修复 products 表 updated_at 字段...');
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    // 修复 orders 表的 created_at 字段
    console.log('🔧 修复 orders 表 created_at 字段...');
    await connection.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // 修复 orders 表的 updated_at 字段
    console.log('🔧 修复 orders 表 updated_at 字段...');
    await connection.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    // 修复 price_schedules 表的 created_at 字段
    console.log('🔧 修复 price_schedules 表 created_at 字段...');
    await connection.execute(`
      ALTER TABLE price_schedules 
      MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // 修复 price_schedules 表的 updated_at 字段
    console.log('🔧 修复 price_schedules 表 updated_at 字段...');
    await connection.execute(`
      ALTER TABLE price_schedules 
      MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    console.log('✅ 所有数据库字段默认值修复完成！');

    // 验证修复结果
    console.log('🔍 验证修复结果...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND COLUMN_NAME IN ('created_at', 'updated_at')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    console.log('📋 时间戳字段状态:');
    tables.forEach(row => {
      console.log(`  ${row.TABLE_NAME}.${row.COLUMN_NAME}: ${row.COLUMN_DEFAULT || 'NULL'} (nullable: ${row.IS_NULLABLE})`);
    });

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行修复
fixDatabaseDefaults().catch(console.error);