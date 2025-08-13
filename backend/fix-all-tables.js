const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllTables() {
  try {
    console.log('🔧 开始全面修复数据库...');
    
    // 创建直接的MySQL连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Lhjr@170103',
      database: process.env.DB_NAME || 'ttkh_tourism'
    });

    console.log('✅ 数据库连接成功');

    // 1. 修复users表
    console.log('🔄 修复users表...');
    
    // 修复username为NULL
    await connection.execute(
      'UPDATE users SET username = CONCAT("user_", id) WHERE username IS NULL OR username = ""'
    );
    
    // 修复email为NULL
    await connection.execute(
      'UPDATE users SET email = CONCAT("user_", id, "@example.com") WHERE email IS NULL OR email = ""'
    );
    
    // 修复password为NULL
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash('123456', 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE password IS NULL OR password = ""',
      [defaultPassword]
    );
    
    // 修复role为NULL
    await connection.execute(
      'UPDATE users SET role = "customer" WHERE role IS NULL'
    );
    
    // 修复status为NULL
    await connection.execute(
      'UPDATE users SET status = "active" WHERE status IS NULL'
    );

    // 2. 修复products表
    console.log('🔄 修复products表...');
    
    // 修复name为NULL
    await connection.execute(
      'UPDATE products SET name = CONCAT("产品_", id) WHERE name IS NULL OR name = ""'
    );
    
    // 修复description为NULL
    await connection.execute(
      'UPDATE products SET description = "暂无描述" WHERE description IS NULL'
    );
    
    // 修复price为NULL
    await connection.execute(
      'UPDATE products SET price = 0 WHERE price IS NULL'
    );
    
    // 修复category为NULL
    await connection.execute(
      'UPDATE products SET category = "其他" WHERE category IS NULL OR category = ""'
    );
    
    // 修复status为NULL
    await connection.execute(
      'UPDATE products SET status = "active" WHERE status IS NULL'
    );

    // 3. 修复orders表
    console.log('🔄 修复orders表...');
    
    // 修复status为NULL
    await connection.execute(
      'UPDATE orders SET status = "pending" WHERE status IS NULL'
    );
    
    // 修复total_price为NULL
    await connection.execute(
      'UPDATE orders SET total_price = 0 WHERE total_price IS NULL'
    );
    
    // 修复unit_price为NULL
    await connection.execute(
      'UPDATE orders SET unit_price = 0 WHERE unit_price IS NULL'
    );
    
    // 修复total_people为NULL
    await connection.execute(
      'UPDATE orders SET total_people = 1 WHERE total_people IS NULL'
    );
    
    // 修复product_title为NULL
    await connection.execute(
      'UPDATE orders SET product_title = "未知产品" WHERE product_title IS NULL OR product_title = ""'
    );
    
    // 修复customer_name为NULL
    await connection.execute(
      'UPDATE orders SET customer_name = "未知客户" WHERE customer_name IS NULL OR customer_name = ""'
    );
    
    // 修复order_number为NULL
    await connection.execute(
      'UPDATE orders SET order_number = CONCAT("ORDER_", id) WHERE order_number IS NULL OR order_number = ""'
    );

    // 4. 检查order_items表是否存在
    try {
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'order_items'"
      );
      
      if (tables.length > 0) {
        console.log('🔄 修复order_items表...');
        
        // 修复quantity为NULL
        await connection.execute(
          'UPDATE order_items SET quantity = 1 WHERE quantity IS NULL'
        );
        
        // 修复price为NULL
        await connection.execute(
          'UPDATE order_items SET price = 0 WHERE price IS NULL'
        );
      } else {
        console.log('⚠️ order_items表不存在，跳过修复');
      }
    } catch (error) {
      console.log('⚠️ order_items表处理出错，跳过:', error.message);
    }

    // 5. 检查并报告修复结果
    console.log('📊 检查修复结果...');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    
    console.log(`✅ Users表: ${userCount[0].count} 条记录`);
    console.log(`✅ Products表: ${productCount[0].count} 条记录`);
    console.log(`✅ Orders表: ${orderCount[0].count} 条记录`);

    await connection.end();
    console.log('✅ 数据库全面修复完成！');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixAllTables().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { fixAllTables };