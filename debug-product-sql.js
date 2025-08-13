const mysql = require('mysql2/promise');

async function debugProductSQL() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });

    console.log('🔗 数据库连接成功');

    // 测试每个字段的插入
    console.log('🧪 测试产品创建SQL的每个部分...');
    
    const productId = 'test-product-id';
    const merchantId = '2'; // 使用已知的商家ID
    
    // 测试基本插入
    console.log('1. 测试基本字段插入...');
    try {
      await connection.execute(
        'INSERT INTO products (id, merchant_id, title_zh, title_th, status) VALUES (?, ?, ?, ?, ?)',
        [productId, merchantId, '测试产品', 'ทดสอบ', 'pending']
      );
      console.log('✅ 基本字段插入成功');
      
      // 清理
      await connection.execute('DELETE FROM products WHERE id = ?', [productId]);
    } catch (error) {
      console.error('❌ 基本字段插入失败:', error.message);
    }

    // 测试完整插入
    console.log('2. 测试完整字段插入...');
    try {
      await connection.execute(
        `INSERT INTO products (id, merchant_id, title_zh, title_th, description_zh, description_th, 
         base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId + '2', merchantId, '测试产品2', 'ทดสอบ2', '描述', null, 
         100, null, null, null, null, 'pending']
      );
      console.log('✅ 完整字段插入成功');
      
      // 清理
      await connection.execute('DELETE FROM products WHERE id = ?', [productId + '2']);
    } catch (error) {
      console.error('❌ 完整字段插入失败:', error.message);
    }

    // 测试带Base64数据的插入
    console.log('3. 测试带Base64数据的插入...');
    try {
      const dummyPoster = `data:image/png;base64,${Buffer.from('poster').toString('base64')}`;
      const dummyPdf = `data:application/pdf;base64,${Buffer.from('pdf-content').toString('base64')}`;
      
      await connection.execute(
        `INSERT INTO products (id, merchant_id, title_zh, title_th, description_zh, description_th, 
         base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId + '3', merchantId, '测试产品3', 'ทดสอบ3', '描述3', null, 
         100, dummyPoster, 'poster.png', dummyPdf, 'info.pdf', 'pending']
      );
      console.log('✅ 带Base64数据插入成功');
      
      // 清理
      await connection.execute('DELETE FROM products WHERE id = ?', [productId + '3']);
    } catch (error) {
      console.error('❌ 带Base64数据插入失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

debugProductSQL().catch(console.error);