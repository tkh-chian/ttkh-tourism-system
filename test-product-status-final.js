const axios = require('axios');

async function testProductStatusUpdate() {
  console.log('🔧 测试产品状态更新API最终修复...\n');

  try {
    // 1. 管理员登录获取token
    console.log('👨‍💼 管理员登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('管理员登录失败');
    }

    const adminToken = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 获取产品列表
    console.log('\n📦 获取产品列表...');
    const productsResponse = await axios.get('http://localhost:3001/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('📊 API响应结构:', {
      success: productsResponse.data.success,
      hasData: !!productsResponse.data.data,
      hasProducts: !!productsResponse.data.data?.products,
      productsCount: productsResponse.data.data?.products?.length || 0
    });

    if (!productsResponse.data.success || !productsResponse.data.data?.products) {
      throw new Error('获取产品列表失败');
    }

    const products = productsResponse.data.data.products;
    console.log(`✅ 获取到 ${products.length} 个产品`);

    if (products.length === 0) {
      console.log('❌ 没有产品可以测试');
      return;
    }

    // 3. 测试产品状态更新API
    const testProduct = products[0];
    console.log(`\n🔄 测试更新产品状态: ${testProduct.title_zh} (${testProduct.id})`);
    console.log(`当前状态: ${testProduct.status}`);

    // 尝试更新状态
    const newStatus = testProduct.status === 'pending' ? 'approved' : 'pending';
    console.log(`尝试更新为: ${newStatus}`);

    const updateResponse = await axios.put(
      `http://localhost:3001/api/admin/products/${testProduct.id}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (updateResponse.data.success) {
      console.log('✅ 产品状态更新成功!');
      console.log(`📊 更新结果: ${updateResponse.data.message}`);
      
      // 验证更新
      const verifyResponse = await axios.get('http://localhost:3001/api/admin/products', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const updatedProduct = verifyResponse.data.data.products.find(p => p.id === testProduct.id);
      console.log(`🔍 验证状态: ${updatedProduct.status}`);
      
      if (updatedProduct.status === newStatus) {
        console.log('🎉 状态更新验证成功!');
        
        // 测试前端页面访问
        console.log('\n🌐 前端页面访问测试:');
        console.log('请访问以下页面验证修复效果:');
        console.log('1. 管理员产品管理: http://localhost:3000/admin/products');
        console.log('2. 应该能看到产品列表和状态更新按钮');
        console.log('3. 点击状态更新按钮应该不再出现404错误');
        
        return true;
      } else {
        console.log('❌ 状态更新验证失败');
        return false;
      }
    } else {
      console.log('❌ 产品状态更新失败:', updateResponse.data.message);
      return false;
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API错误:', error.response.status, error.response.data);
      if (error.response.status === 404) {
        console.log('🔍 404错误说明API路由仍然不存在或有问题');
      }
    } else {
      console.log('❌ 网络错误:', error.message);
    }
    return false;
  }
}

testProductStatusUpdate().then(success => {
  if (success) {
    console.log('\n🎉 产品状态更新API修复完成！');
    console.log('✅ 管理员产品管理页面的404错误已解决');
  } else {
    console.log('\n❌ 产品状态更新API仍有问题，需要进一步调试');
  }
});