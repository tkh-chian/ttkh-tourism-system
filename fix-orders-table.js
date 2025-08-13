const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function fixOrdersTable() {
  let connection;
  
  try {
    console.log('🔧 开始修复订单表结构...');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 成功连接到MySQL数据库');
    
    // 检查当前订单表结构
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 当前订单表字段:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // 检查是否需要添加缺失的字段
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    const requiredFields = [
      'product_id', 'travel_date', 'adults', 'children_no_bed', 
      'children_with_bed', 'infants', 'total_people', 'unit_price', 
      'total_price', 'customer_name', 'customer_phone', 'customer_email', 'notes'
    ];
    
    console.log('\n🔍 检查缺失字段...');
    
    // 添加缺失的字段
    if (!existingColumns.includes('product_id')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN product_id INT');
      console.log('✅ 添加字段: product_id');
    }
    
    if (!existingColumns.includes('travel_date')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN travel_date DATE');
      console.log('✅ 添加字段: travel_date');
    }
    
    if (!existingColumns.includes('adults')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN adults INT DEFAULT 0');
      console.log('✅ 添加字段: adults');
    }
    
    if (!existingColumns.includes('children_no_bed')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN children_no_bed INT DEFAULT 0');
      console.log('✅ 添加字段: children_no_bed');
    }
    
    if (!existingColumns.includes('children_with_bed')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN children_with_bed INT DEFAULT 0');
      console.log('✅ 添加字段: children_with_bed');
    }
    
    if (!existingColumns.includes('infants')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN infants INT DEFAULT 0');
      console.log('✅ 添加字段: infants');
    }
    
    if (!existingColumns.includes('total_people')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN total_people INT DEFAULT 0');
      console.log('✅ 添加字段: total_people');
    }
    
    if (!existingColumns.includes('unit_price')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ 添加字段: unit_price');
    }
    
    if (!existingColumns.includes('total_price')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ 添加字段: total_price');
    }
    
    if (!existingColumns.includes('customer_name')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100)');
      console.log('✅ 添加字段: customer_name');
    }
    
    if (!existingColumns.includes('customer_phone')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20)');
      console.log('✅ 添加字段: customer_phone');
    }
    
    if (!existingColumns.includes('customer_email')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN customer_email VARCHAR(100)');
      console.log('✅ 添加字段: customer_email');
    }
    
    if (!existingColumns.includes('notes')) {
      await connection.execute('ALTER TABLE orders ADD COLUMN notes TEXT');
      console.log('✅ 添加字段: notes');
    }
    
    // 更新状态枚举值
    if (existingColumns.includes('status')) {
      await connection.execute(`
        ALTER TABLE orders MODIFY COLUMN status 
        ENUM('pending', 'paid', 'confirmed', 'cancelled', 'refunded', 'completed', 'rejected', 'archived', 'returned') 
        DEFAULT 'pending'
      `);
      console.log('✅ 更新状态枚举值');
    }
    
    // 添加外键约束（如果不存在）
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_product 
        FOREIGN KEY (product_id) REFERENCES products(id)
      `);
      console.log('✅ 添加产品外键约束');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.log('⚠️ 产品外键约束可能已存在');
      }
    }
    
    console.log('\n🎉 订单表结构修复完成！');
    
    // 显示最终表结构
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 最终订单表字段:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ 修复订单表失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 运行修复
if (require.main === module) {
  fixOrdersTable()
    .then(() => {
      console.log('🚀 订单表修复完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixOrdersTable };