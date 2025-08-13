const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root', 
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function initializeTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');

    // 检查categories表
    console.log('\n📋 检查categories表...');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`categories表记录数: ${categories[0].count}`);
    
    if (categories[0].count === 0) {
      console.log('插入默认分类...');
      await connection.execute(`
        INSERT INTO categories (name, status, sort_order, created_at) VALUES 
        ('海岛游', 'active', 1, NOW()),
        ('文化游', 'active', 2, NOW()),
        ('美食游', 'active', 3, NOW()),
        ('城市游', 'active', 4, NOW()),
        ('探险游', 'active', 5, NOW())
      `);
      console.log('✅ 默认分类插入成功');
    }

    // 检查products表结构
    console.log('\n📋 检查products表结构...');
    const [columns] = await connection.execute('DESCRIBE products');
    console.log('products表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(非空)'}`);
    });

    // 检查现有产品
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`\nproducts表记录数: ${products[0].count}`);

    console.log('\n🎉 数据库表检查完成！');
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeTables();