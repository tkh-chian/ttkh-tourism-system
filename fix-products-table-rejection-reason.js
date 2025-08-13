const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixProductsTable() {
  console.log('🔧 修复products表结构...\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查rejection_reason字段是否存在
    console.log('\n🔍 检查products表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 当前products表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 检查是否存在rejection_reason字段
    const hasRejectionReason = columns.some(col => col.COLUMN_NAME === 'rejection_reason');
    
    if (!hasRejectionReason) {
      console.log('\n➕ 添加rejection_reason字段...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN rejection_reason TEXT NULL COMMENT '拒绝原因'
      `);
      console.log('✅ rejection_reason字段添加成功');
    } else {
      console.log('\n✅ rejection_reason字段已存在');
    }

    // 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const [updatedColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'rejection_reason'
    `);

    if (updatedColumns.length > 0) {
      console.log('✅ rejection_reason字段验证成功:', updatedColumns[0]);
    } else {
      console.log('❌ rejection_reason字段验证失败');
    }

    console.log('\n🎉 products表结构修复完成！');

  } catch (error) {
    console.error('❌ 修复过程出错:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

fixProductsTable();