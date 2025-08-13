const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function debugProductCreation() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 检查 products 表结构
    console.log('🔍 检查 products 表结构...');
    const [tableInfo] = await connection.execute(`
      DESCRIBE products
    `);
    
    console.log('📋 products 表字段:');
    tableInfo.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default || ''}`);
    });

    // 测试产品创建SQL
    console.log('\n🧪 测试产品创建SQL...');
    const productId = uuidv4();
    const merchantId = 'test-merchant-id';
    
    try {
      const result = await connection.execute(
        `INSERT INTO products (id, merchant_id, title_zh, title_th, description_zh, description_th, 
         base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, merchantId, '测试产品', 'ผลิตภัณฑ์ทดสอบ', '测试描述', null, 
         1000, null, null, null, null, 'pending']
      );
      
      console.log('✅ 产品创建SQL成功');
      console.log('📊 插入结果:', result[0]);
      
      // 清理测试数据
      await connection.execute('DELETE FROM products WHERE id = ?', [productId]);
      console.log('🧹 测试数据已清理');
      
    } catch (error) {
      console.error('❌ 产品创建SQL失败:', error.message);
      console.error('📋 错误详情:', error);
    }

    // 检查是否有商家用户
    console.log('\n🔍 检查商家用户...');
    const [merchants] = await connection.execute(`
      SELECT id, username, email, role, status FROM users WHERE role = 'merchant' LIMIT 5
    `);
    
    console.log('📋 商家用户列表:');
    merchants.forEach(merchant => {
      console.log(`  ${merchant.id}: ${merchant.username} (${merchant.email}) - ${merchant.status}`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

debugProductCreation().catch(console.error);