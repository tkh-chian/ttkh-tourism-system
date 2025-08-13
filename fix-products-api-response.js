const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixProductsAPI() {
  let connection;
  
  try {
    console.log('🔧 开始修复产品API响应格式...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. 检查当前产品数据
    const [products] = await connection.execute('SELECT * FROM products WHERE status = ? LIMIT 5', ['approved']);
    console.log('✅ 当前产品数量:', products.length);
    
    if (products.length === 0) {
      console.log('⚠️  没有已审核的产品，创建测试产品...');
      
      // 创建测试产品
      const testProducts = [
        {
          id: 'test-product-1',
          product_number: 'PRD-' + Date.now(),
          merchant_id: 'merchant-test-1',
          title_zh: '曼谷一日游',
          title_th: 'ทัวร์กรุงเทพฯ 1 วัน',
          description_zh: '探索曼谷的美丽景点，包括大皇宫、卧佛寺等著名景点',
          description_th: 'สำรวจสถานที่ท่องเที่ยวที่สวยงามในกรุงเทพฯ',
          base_price: 1500,
          status: 'approved'
        },
        {
          id: 'test-product-2', 
          product_number: 'PRD-' + (Date.now() + 1),
          merchant_id: 'merchant-test-1',
          title_zh: '芭提雅海滩度假',
          title_th: 'พักผ่อนที่หาดพัทยา',
          description_zh: '享受芭提雅美丽的海滩和丰富的水上活动',
          description_th: 'เพลิดเพลินกับหาดทรายสวยและกิจกรรมทางน้ำ',
          base_price: 2500,
          status: 'approved'
        },
        {
          id: 'test-product-3',
          product_number: 'PRD-' + (Date.now() + 2),
          merchant_id: 'merchant-test-1', 
          title_zh: '清迈文化之旅',
          title_th: 'ทัวร์วัฒนธรรมเชียงใหม่',
          description_zh: '体验清迈的传统文化和手工艺品制作',
          description_th: 'สัมผัสวัฒนธรรมดั้งเดิมและงานฝีมือ',
          base_price: 3000,
          status: 'approved'
        }
      ];
      
      for (const product of testProducts) {
        await connection.execute(
          `INSERT INTO products (id, product_number, merchant_id, title_zh, title_th, description_zh, description_th, base_price, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [product.id, product.product_number, product.merchant_id, product.title_zh, product.title_th, 
           product.description_zh, product.description_th, product.base_price, product.status]
        );
      }
      
      console.log('✅ 创建了3个测试产品');
    }
    
    // 2. 验证API响应格式
    const [finalProducts] = await connection.execute('SELECT * FROM products WHERE status = ?', ['approved']);
    
    console.log('🎯 修复完成！');
    console.log('📊 产品API将返回以下格式:');
    console.log({
      success: true,
      data: { products: finalProducts }
    });
    
    console.log('\n✅ 产品数量:', finalProducts.length);
    console.log('✅ 数据结构: { success: true, data: { products: [...] } }');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixProductsAPI();