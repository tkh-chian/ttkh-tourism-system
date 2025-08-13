const mysql = require('mysql2/promise');

async function fixAllDatetimeIssues() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔧 修复所有表的日期时间问题...');

    // 1. 设置 SQL 模式以允许零日期
    await connection.execute("SET SESSION sql_mode = 'ALLOW_INVALID_DATES'");
    console.log('✅ 设置 SQL 模式');

    // 2. 获取所有表
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log('📋 发现表:', tableNames.join(', '));

    // 3. 修复每个表的日期时间问题
    for (const tableName of tableNames) {
      console.log(`\n🔄 处理表: ${tableName}`);
      
      try {
        // 获取表结构
        const [columns] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        const dateColumns = columns.filter(col => 
          col.Type.toLowerCase().includes('datetime') || 
          col.Type.toLowerCase().includes('timestamp')
        );

        if (dateColumns.length === 0) {
          console.log(`  ℹ️ ${tableName} 没有日期时间列`);
          continue;
        }

        console.log(`  📋 日期时间列:`, dateColumns.map(col => col.Field).join(', '));

        // 检查并修复无效日期
        for (const col of dateColumns) {
          const columnName = col.Field;
          
          // 检查是否有无效日期
          const [invalidRows] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM ${tableName} 
            WHERE ${columnName} = '0000-00-00 00:00:00' 
               OR ${columnName} IS NULL
          `);

          if (invalidRows[0].count > 0) {
            console.log(`  🔧 修复 ${columnName} 列中的 ${invalidRows[0].count} 条无效记录`);
            
            // 修复无效日期
            await connection.execute(`
              UPDATE ${tableName} 
              SET ${columnName} = NOW() 
              WHERE ${columnName} = '0000-00-00 00:00:00' 
                 OR ${columnName} IS NULL
            `);
            console.log(`  ✅ 修复了 ${columnName} 列`);
          } else {
            console.log(`  ✅ ${columnName} 列没有无效日期`);
          }
        }

        // 检查是否需要添加 Sequelize 时间戳列
        const hasCreatedAt = columns.some(col => col.Field === 'createdAt');
        const hasUpdatedAt = columns.some(col => col.Field === 'updatedAt');

        if (!hasCreatedAt) {
          console.log(`  🔧 为 ${tableName} 添加 createdAt 列`);
          await connection.execute(`
            ALTER TABLE ${tableName} 
            ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          `);
          console.log(`  ✅ 添加了 createdAt 列`);
        }

        if (!hasUpdatedAt) {
          console.log(`  🔧 为 ${tableName} 添加 updatedAt 列`);
          await connection.execute(`
            ALTER TABLE ${tableName} 
            ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          `);
          console.log(`  ✅ 添加了 updatedAt 列`);
        }

        // 同步现有数据到 Sequelize 格式
        if (!hasCreatedAt || !hasUpdatedAt) {
          const hasCreatedAtOld = columns.some(col => col.Field === 'created_at');
          const hasUpdatedAtOld = columns.some(col => col.Field === 'updated_at');

          let updateQuery = `UPDATE ${tableName} SET `;
          let updates = [];

          if (!hasCreatedAt) {
            if (hasCreatedAtOld) {
              updates.push('createdAt = COALESCE(created_at, NOW())');
            } else {
              updates.push('createdAt = NOW()');
            }
          }

          if (!hasUpdatedAt) {
            if (hasUpdatedAtOld) {
              updates.push('updatedAt = COALESCE(updated_at, NOW())');
            } else {
              updates.push('updatedAt = NOW()');
            }
          }

          if (updates.length > 0) {
            updateQuery += updates.join(', ');
            await connection.execute(updateQuery);
            console.log(`  ✅ 同步了 ${tableName} 的时间戳数据`);
          }
        }

      } catch (error) {
        console.log(`  ❌ 处理 ${tableName} 时出错: ${error.message}`);
      }
    }

    // 4. 重置 SQL 模式为严格模式
    await connection.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    console.log('\n✅ 重置 SQL 模式为严格模式');

    console.log('\n🎉 所有表的日期时间问题修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  fixAllDatetimeIssues()
    .then(() => {
      console.log('✅ 修复完成，现在可以重新启动后端服务');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixAllDatetimeIssues };