const mysql = require('mysql2/promise');

async function fixDatetimeValues() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔧 修复数据库中的无效日期时间值...');

    // 1. 设置 SQL 模式以允许零日期
    await connection.execute("SET SESSION sql_mode = 'ALLOW_INVALID_DATES'");
    console.log('✅ 设置 SQL 模式');

    // 2. 检查 users 表结构
    const [columns] = await connection.execute("SHOW COLUMNS FROM users");
    console.log('📋 users 表列:', columns.map(col => col.Field).join(', '));

    // 3. 检查并修复 users 表中的无效日期
    const [rows] = await connection.execute(`
      SELECT id, created_at, updated_at 
      FROM users 
      WHERE created_at = '0000-00-00 00:00:00' 
         OR updated_at = '0000-00-00 00:00:00'
         OR created_at IS NULL 
         OR updated_at IS NULL
    `);

    if (rows.length > 0) {
      console.log(`📝 发现 ${rows.length} 条记录需要修复`);
      
      // 修复无效的日期时间值
      await connection.execute(`
        UPDATE users 
        SET created_at = NOW(), updated_at = NOW() 
        WHERE created_at = '0000-00-00 00:00:00' 
           OR updated_at = '0000-00-00 00:00:00'
           OR created_at IS NULL 
           OR updated_at IS NULL
      `);
      console.log('✅ 修复了无效的日期时间值');
    } else {
      console.log('ℹ️ 没有发现需要修复的记录');
    }

    // 4. 检查是否存在 createdAt 和 updatedAt 列
    const hasCreatedAt = columns.some(col => col.Field === 'createdAt');
    const hasUpdatedAt = columns.some(col => col.Field === 'updatedAt');

    if (!hasCreatedAt || !hasUpdatedAt) {
      console.log('🔧 添加 Sequelize 时间戳列...');
      
      if (!hasCreatedAt) {
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ 添加了 createdAt 列');
      }
      
      if (!hasUpdatedAt) {
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        console.log('✅ 添加了 updatedAt 列');
      }

      // 同步现有数据到 Sequelize 格式
      await connection.execute(`
        UPDATE users 
        SET createdAt = COALESCE(created_at, NOW()),
            updatedAt = COALESCE(updated_at, NOW())
      `);
      console.log('✅ 同步了现有数据到 Sequelize 格式');
    }

    // 5. 检查其他表的日期时间问题
    const tables = ['products', 'orders', 'price_schedules'];
    for (const table of tables) {
      try {
        const [tableRows] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM ${table} 
          WHERE created_at = '0000-00-00 00:00:00' 
             OR updated_at = '0000-00-00 00:00:00'
        `);
        
        if (tableRows[0].count > 0) {
          await connection.execute(`
            UPDATE ${table} 
            SET created_at = NOW(), updated_at = NOW() 
            WHERE created_at = '0000-00-00 00:00:00' 
               OR updated_at = '0000-00-00 00:00:00'
          `);
          console.log(`✅ 修复了 ${table} 表中的日期时间值`);
        }
      } catch (e) {
        console.log(`ℹ️ 跳过表 ${table}: ${e.message}`);
      }
    }

    // 6. 重置 SQL 模式为严格模式
    await connection.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    console.log('✅ 重置 SQL 模式为严格模式');

    console.log('🎉 数据库日期时间值修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  fixDatetimeValues()
    .then(() => {
      console.log('✅ 修复完成，现在可以重新启动后端服务');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixDatetimeValues };