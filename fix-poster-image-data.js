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

    // 1. 首先查看当前 poster_image 列的结构和数据
    console.log('📋 检查当前 poster_image 列结构...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM products LIKE 'poster_image'
    `);
    console.log('当前列结构:', columns[0]);

    // 2. 查看有问题的数据
    console.log('📋 检查过长的 poster_image 数据...');
    const [longData] = await connection.execute(`
      SELECT id, title, LENGTH(poster_image) as image_length, 
             LEFT(poster_image, 100) as image_preview
      FROM products 
      WHERE LENGTH(poster_image) > 255
      ORDER BY LENGTH(poster_image) DESC
    `);
    
    if (longData.length > 0) {
      console.log(`发现 ${longData.length} 条过长数据:`);
      longData.forEach(row => {
        console.log(`- ID: ${row.id}, 标题: ${row.title}, 长度: ${row.image_length}`);
        console.log(`  预览: ${row.image_preview}...`);
      });

      // 3. 清理过长的数据 - 截断或清空
      console.log('🔧 清理过长的 poster_image 数据...');
      
      // 选项1: 截断到255字符
      await connection.execute(`
        UPDATE products 
        SET poster_image = LEFT(poster_image, 255)
        WHERE LENGTH(poster_image) > 255
      `);
      
      console.log('✅ 已截断过长的 poster_image 数据到255字符');
    } else {
      console.log('✅ 没有发现过长的 poster_image 数据');
    }

    // 4. 现在尝试修改列类型为 LONGTEXT
    console.log('🔧 修改 poster_image 列类型为 LONGTEXT...');
    await connection.execute(`
      ALTER TABLE products 
      MODIFY COLUMN poster_image LONGTEXT
    `);
    console.log('✅ 成功修改 poster_image 列类型为 LONGTEXT');

    // 5. 同样处理其他可能的图片列
    const imageColumns = ['gallery_images', 'detail_images'];
    
    for (const column of imageColumns) {
      try {
        console.log(`🔧 检查并修改 ${column} 列...`);
        
        // 检查列是否存在
        const [colExists] = await connection.execute(`
          SHOW COLUMNS FROM products LIKE '${column}'
        `);
        
        if (colExists.length > 0) {
          // 清理过长数据
          await connection.execute(`
            UPDATE products 
            SET ${column} = LEFT(${column}, 255)
            WHERE LENGTH(${column}) > 255
          `);
          
          // 修改列类型
          await connection.execute(`
            ALTER TABLE products 
            MODIFY COLUMN ${column} LONGTEXT
          `);
          console.log(`✅ 成功修改 ${column} 列类型为 LONGTEXT`);
        }
      } catch (error) {
        console.log(`⚠️ 处理 ${column} 列时出错:`, error.message);
      }
    }

    // 6. 验证修改结果
    console.log('📋 验证修改结果...');
    const [finalColumns] = await connection.execute(`
      SHOW COLUMNS FROM products 
      WHERE Field IN ('poster_image', 'gallery_images', 'detail_images')
    `);
    
    console.log('修改后的列结构:');
    finalColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    console.log('🎉 poster_image 数据修复完成！');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 运行修复
fixPosterImageData().catch(console.error);