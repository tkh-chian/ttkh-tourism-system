const mysql = require('mysql2/promise');

async function fixProductsTableDefaults() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 检查当前表结构
    console.log('🔍 检查 products 表结构...');
    const [tableInfo] = await connection.execute('DESCRIBE products');
    
    console.log('📋 products 表字段:');
    tableInfo.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default || 'NO DEFAULT'}`);
    });

    // 修复字段默认值
    console.log('\n🔧 修复 products 表字段默认值...');
    
    // 为 base_price 添加默认值
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN base_price DECIMAL(10,2) NOT NULL DEFAULT 0
    `);
    console.log('✅ base_price 字段默认值已设置为 0');

    // 为 title_zh 添加默认值
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN title_zh VARCHAR(200) NOT NULL DEFAULT ''
    `);
    console.log('✅ title_zh 字段默认值已设置为空字符串');

    // 为 title_th 添加默认值
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN title_th VARCHAR(200) NOT NULL DEFAULT ''
    `);
    console.log('✅ title_th 字段默认值已设置为空字符串');

    // 将 product_number 字段修改为可空，避免插入出错
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN product_number VARCHAR(50) NULL
    `);
    console.log('✅ 已将 product_number 字段修改为可空');

    // 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const [updatedTableInfo] = await connection.execute('DESCRIBE products');
    
    console.log('📋 修复后的 products 表字段:');
    updatedTableInfo.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default || 'NO DEFAULT'}`);
    });

    // 测试插入
    console.log('\n🧪 测试基本字段插入...');
    const testId = 'test-default-' + Date.now();
    try {
      await connection.execute(
        'INSERT INTO products (id, merchant_id) VALUES (?, ?)',
        [testId, '2']
      );
      console.log('✅ 基本字段插入成功（使用默认值）');
      
      // 清理测试数据
      await connection.execute('DELETE FROM products WHERE id = ?', [testId]);
      console.log('🧹 测试数据已清理');
    } catch (error) {
      console.error('❌ 基本字段插入失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

fixProductsTableDefaults().catch(console.error);