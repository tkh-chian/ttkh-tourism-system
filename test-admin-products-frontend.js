const axios = require('axios');

async function testAdminProductsFrontend() {
  console.log('🔧 测试管理员产品前端修复...\n');
  
  try {
    // 1. 获取管理员token
    console.log('👨‍💼 获取管理员token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.token) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 2. 测试管理员产品API
    console.log('\n📦 测试管理员产品API...');
    const productsResponse = await axios.get('http://localhost:3001/api/admin/products', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('📊 API响应结构:');
    console.log('- success:', productsResponse.data.success);
    console.log('- data存在:', !!productsResponse.data.data);
    
    if (productsResponse.data.data) {
      console.log('- data.products存在:', !!productsResponse.data.data.products);
      console.log('- data是数组:', Array.isArray(productsResponse.data.data));
      
      if (productsResponse.data.data.products) {
        console.log('- products数量:', productsResponse.data.data.products.length);
        if (productsResponse.data.data.products.length > 0) {
          const firstProduct = productsResponse.data.data.products[0];
          console.log('- 第一个产品:', {
            id: firstProduct.id,
            title_zh: firstProduct.title_zh,
            status: firstProduct.status,
            merchant_name: firstProduct.merchant_name
          });
        }
      } else if (Array.isArray(productsResponse.data.data)) {
        console.log('- data直接是数组，长度:', productsResponse.data.data.length);
        if (productsResponse.data.data.length > 0) {
          const firstProduct = productsResponse.data.data[0];
          console.log('- 第一个产品:', {
            id: firstProduct.id,
            title_zh: firstProduct.title_zh,
            status: firstProduct.status,
            merchant_name: firstProduct.merchant_name
          });
        }
      }
    }
    
    // 3. 模拟前端数据处理逻辑
    console.log('\n🔍 模拟前端数据处理...');
    const data = productsResponse.data;
    let productsData = [];
    
    if (data.success && data.data) {
      // 新格式: { success: true, data: { products: [...] } }
      if (data.data.products && Array.isArray(data.data.products)) {
        productsData = data.data.products;
        console.log('✅ 使用 data.data.products 格式');
      }
      // 或者直接是数组: { success: true, data: [...] }
      else if (Array.isArray(data.data)) {
        productsData = data.data;
        console.log('✅ 使用 data.data 数组格式');
      }
    }
    // 兼容旧格式
    else if (Array.isArray(data.products)) {
      productsData = data.products;
      console.log('✅ 使用 data.products 格式');
    }
    else if (Array.isArray(data)) {
      productsData = data;
      console.log('✅ 使用 data 数组格式');
    }
    
    console.log('📋 处理结果:');
    console.log('- 产品数量:', productsData.length);
    
    if (productsData.length > 0) {
      console.log('- 产品列表:');
      productsData.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title_zh || '未设置'} (状态: ${product.status})`);
      });
      
      // 4. 按状态分组统计
      console.log('\n📊 按状态分组统计:');
      const statusCounts = {
        pending: productsData.filter(p => p.status === 'pending').length,
        approved: productsData.filter(p => p.status === 'approved').length,
        rejected: productsData.filter(p => p.status === 'rejected').length
      };
      
      console.log('- 待审核:', statusCounts.pending);
      console.log('- 已批准:', statusCounts.approved);
      console.log('- 已拒绝:', statusCounts.rejected);
      
      console.log('\n🎉 前端应该能正确显示产品了！');
      console.log('\n📋 验证步骤:');
      console.log('1. 访问 http://localhost:3000/admin/products');
      console.log('2. 应该能看到统计卡片显示正确的数量');
      console.log('3. 应该能看到产品列表显示所有产品');
      console.log('4. 可以按状态筛选产品');
      
    } else {
      console.log('❌ 没有找到产品数据');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

testAdminProductsFrontend().catch(console.error);