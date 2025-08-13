const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugAdminProductsIssue() {
  console.log('🔍 调试管理员产品管理问题...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查products表中的所有产品
    console.log('\n📦 检查products表中的所有产品:');
    const [allProducts] = await connection.execute('SELECT * FROM products ORDER BY created_at DESC');
    console.log(`总产品数量: ${allProducts.length}`);
    
    if (allProducts.length > 0) {
      console.log('\n产品列表:');
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}`);
        console.log(`   标题: ${product.title_zh || '未设置'}`);
        console.log(`   商家ID: ${product.merchant_id}`);
        console.log(`   状态: ${product.status}`);
        console.log(`   创建时间: ${product.created_at}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ 没有找到任何产品');
      return;
    }
    
    // 2. 检查商家信息
    console.log('\n👥 检查商家信息:');
    const [merchants] = await connection.execute('SELECT id, username, email, role, status FROM users WHERE role = "merchant"');
    console.log(`商家数量: ${merchants.length}`);
    
    merchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ID: ${merchant.id}`);
      console.log(`   用户名: ${merchant.username}`);
      console.log(`   邮箱: ${merchant.email}`);
      console.log(`   状态: ${merchant.status}`);
      console.log('   ---');
    });
    
    // 3. 测试管理员产品API
    console.log('\n🔧 测试管理员产品API...');
    
    // 先获取管理员token
    const axios = require('axios');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 测试管理员产品API
    try {
      const productsResponse = await axios.get('http://localhost:3001/api/admin/products', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('\n📊 管理员产品API响应:');
      console.log('- 成功:', productsResponse.data.success);
      console.log('- 产品数量:', productsResponse.data.data?.products?.length || 0);
      
      if (productsResponse.data.data?.products?.length > 0) {
        console.log('\nAPI返回的产品:');
        productsResponse.data.data.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.title_zh || '未设置'} (状态: ${product.status})`);
        });
      } else {
        console.log('❌ API没有返回任何产品');
      }
      
    } catch (apiError) {
      console.log('❌ 管理员产品API调用失败:', apiError.response?.data || apiError.message);
    }
    
    // 4. 检查不同状态的产品
    console.log('\n📋 按状态分组的产品:');
    const [statusGroups] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM products 
      GROUP BY status
    `);
    
    statusGroups.forEach(group => {
      console.log(`- ${group.status}: ${group.count}个`);
    });
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugAdminProductsIssue().catch(console.error);