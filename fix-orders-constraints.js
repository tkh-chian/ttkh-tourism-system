const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixOrdersConstraints() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接到MySQL数据库');

    // 检查外键约束
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'orders'
    `);
    
    console.log('Orders表相关外键约束:');
    constraints.forEach(row => {
      console.log(`- ${row.CONSTRAINT_NAME}: ${row.TABLE_NAME}.${row.COLUMN_NAME}`);
    });

    // 如果有外键约束，先删除
    for (const constraint of constraints) {
      try {
        await connection.execute(`
          ALTER TABLE ${constraint.TABLE_NAME} 
          DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
        `);
        console.log(`✅ 删除外键约束: ${constraint.CONSTRAINT_NAME}`);
      } catch (error) {
        console.log(`⚠️ 删除外键约束失败: ${constraint.CONSTRAINT_NAME} - ${error.message}`);
      }
    }

    // 修改orders表的id字段为varchar(36)
    await connection.execute(`
      ALTER TABLE orders MODIFY COLUMN id VARCHAR(36) NOT NULL
    `);
    console.log('✅ 修复orders表id字段长度为VARCHAR(36)');

    // 如果有order_items表，也修改其order_id字段
    try {
      await connection.execute(`
        ALTER TABLE order_items MODIFY COLUMN order_id VARCHAR(36)
      `);
      console.log('✅ 修复order_items表order_id字段长度');
      
      // 重新创建外键约束
      await connection.execute(`
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_ibfk_1 
        FOREIGN KEY (order_id) REFERENCES orders(id)
      `);
      console.log('✅ 重新创建外键约束');
    } catch (error) {
      console.log('⚠️ order_items表不存在或修改失败:', error.message);
    }

    // 验证修改结果
    const [rows] = await connection.execute('DESCRIBE orders');
    const idField = rows.find(row => row.Field === 'id');
    console.log(`✅ orders表id字段类型: ${idField.Type}`);

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

fixOrdersConstraints();