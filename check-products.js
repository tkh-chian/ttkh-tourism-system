const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function checkProducts() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🔍 检查数据库中的产品数据...\n');
    
    // 查询所有产品
    const [products] = await connection.execute(`
      SELECT p.id, p.title_zh, p.merchant_id, p.status, p.created_at, u.username as merchant_name
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`📊 总共找到 ${products.length} 个产品:`);
    console.log('=====================================');
    
    if (products.length === 0) {
      console.log('❌ 数据库中没有产品数据');
    } else {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}`);
        console.log(`   标题: ${product.title_zh}`);
        console.log(`   商家: ${product.merchant_name} (ID: ${product.merchant_id})`);
        console.log(`   状态: ${product.status}`);
        console.log(`   创建时间: ${product.created_at}`);
        console.log('-----------------------------------');
      });
    }
    
    // 按状态统计
    const statusCount = {};
    products.forEach(p => {
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    
    console.log('\n📈 按状态统计:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 个`);
    });
    
    await connection.end();
    console.log('\n✅ 检查完成');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkProducts();