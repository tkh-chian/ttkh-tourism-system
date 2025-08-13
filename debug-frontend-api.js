const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 模拟管理员token验证
function verifyAdminToken() {
  const adminPayload = {
    id: 1,
    username: 'admin',
    email: 'admin@ttkh.com',
    role: 'admin'
  };
  
  const token = jwt.sign(adminPayload, 'your-secret-key', { expiresIn: '24h' });
  return token;
}

async function debugFrontendAPI() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('=== 模拟前端API调用 ===');
    
    // 模拟管理员产品API的完整查询
    const [products] = await connection.execute(`
      SELECT 
        p.id,
        p.merchant_id,
        p.title_zh,
        p.title_th,
        p.description_zh,
        p.description_th,
        p.base_price,
        p.poster_image,
        p.poster_filename,
        p.pdf_file,
        p.pdf_filename,
        p.status,
        p.view_count,
        p.order_count,
        p.created_at,
        p.updated_at,
        u.username as merchant_name,
        u.company_name
      FROM products p 
      LEFT JOIN users u ON p.merchant_id = u.id 
      ORDER BY p.created_at DESC
    `);

    console.log(`\n查询到产品总数: ${products.length}`);
    
    // 按状态统计
    const pending = products.filter(p => p.status === 'pending');
    const approved = products.filter(p => p.status === 'approved');
    const rejected = products.filter(p => p.status === 'rejected');
    
    console.log(`待审核: ${pending.length}`);
    console.log(`已批准: ${approved.length}`);
    console.log(`已拒绝: ${rejected.length}`);

    // 检查待审核产品的数据完整性
    console.log('\n=== 待审核产品数据检查 ===');
    pending.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title_zh}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   商家: ${product.merchant_name || '未知'}`);
      console.log(`   价格: ${product.base_price}`);
      console.log(`   状态: ${product.status}`);
      console.log(`   图片: ${product.poster_image ? '有' : '无'}`);
      console.log(`   创建时间: ${product.created_at}`);
      
      // 检查必要字段是否为空
      const missingFields = [];
      if (!product.title_zh) missingFields.push('title_zh');
      if (!product.merchant_id) missingFields.push('merchant_id');
      if (!product.base_price) missingFields.push('base_price');
      if (!product.status) missingFields.push('status');
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️ 缺少字段: ${missingFields.join(', ')}`);
      } else {
        console.log(`   ✅ 数据完整`);
      }
    });

    // 模拟API响应格式
    const apiResponse = {
      success: true,
      data: products,
      total: products.length,
      stats: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length
      }
    };

    console.log('\n=== API响应格式 ===');
    console.log(`响应结构: success=${apiResponse.success}, data.length=${apiResponse.data.length}`);
    console.log(`统计信息: pending=${apiResponse.stats.pending}, approved=${apiResponse.stats.approved}, rejected=${apiResponse.stats.rejected}`);

    // 生成管理员token用于测试
    const adminToken = verifyAdminToken();
    console.log('\n=== 管理员Token ===');
    console.log(`Token: ${adminToken.substring(0, 50)}...`);
    console.log('请在浏览器控制台中设置此token:');
    console.log(`localStorage.setItem('token', '${adminToken}');`);

  } catch (error) {
    console.error('调试错误:', error);
  } finally {
    await connection.end();
  }
}

debugFrontendAPI();