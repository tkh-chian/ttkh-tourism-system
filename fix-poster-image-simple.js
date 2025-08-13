const mysql = require('mysql2/promise');

async function fixPosterImageData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔧 修复 poster_image 列数据...');

    // 1. 查看 products 表结构
    console.log('📋 检查 products 表结构...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM products`);
    console.log('Products 表列:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    // 2. 检查是否有过长的数据（不依赖 title 列）
    console.log('📋 检查过长的 poster_image 数据...');
    const [longData] = await connection.execute(`
      SELECT id, LENGTH(poster_image) as image_length, 
             LEFT(poster_image, 50) as image_preview
      FROM products 
      WHERE poster_image IS NOT NULL 
        AND LENGTH(poster_image) > 255
      ORDER BY LENGTH(poster_image) DESC
      LIMIT 10
    `);
    
    if (longData.length > 0) {
      console.log(`发现 ${longData.length} 条过长数据:`);
      longData.forEach(row => {
        console.log(`- ID: ${row.id}, 长度: ${row.image_length}`);
        console.log(`  预览: ${row.image_preview}...`);
      });

      // 3. 由于列已经是 longtext，我们只需要确保数据没有问题
      console.log('✅ poster_image 列已经是 LONGTEXT 类型，数据长度正常');
    } else {
      console.log('✅ 没有发现过长的 poster_image 数据');
    }

    // 4. 检查其他可能的图片列
    const imageColumns = ['gallery_images', 'detail_images'];
    
    for (const column of imageColumns) {
      try {
        console.log(`🔧 检查 ${column} 列...`);
        
        // 检查列是否存在
        const [colExists] = await connection.execute(`
          SHOW COLUMNS FROM products LIKE '${column}'
        `);
        
        if (colExists.length > 0) {
          console.log(`- ${column}: ${colExists[0].Type}`);
          
          // 如果不是 LONGTEXT，则修改
          if (!colExists[0].Type.toLowerCase().includes('longtext')) {
            console.log(`🔧 修改 ${column} 列类型为 LONGTEXT...`);
            await connection.execute(`
              ALTER TABLE products 
              MODIFY COLUMN ${column} LONGTEXT
            `);
            console.log(`✅ 成功修改 ${column} 列类型为 LONGTEXT`);
          } else {
            console.log(`✅ ${column} 已经是 LONGTEXT 类型`);
          }
        } else {
          console.log(`⚠️ ${column} 列不存在`);
        }
      } catch (error) {
        console.log(`⚠️ 处理 ${column} 列时出错:`, error.message);
      }
    }

    console.log('🎉 poster_image 数据检查完成！');
    console.log('现在尝试重新启动后端服务...');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 运行修复
fixPosterImageData().catch(console.error);