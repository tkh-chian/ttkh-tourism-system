const axios = require('axios');

async function testProductStatusUpdate() {
  console.log('🔧 测试产品状态更新API修复...\n');

  try {
    // 1. 管理员登录获取token
    console.log('👨‍💼 管理员登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
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

    if (!productsResponse.data.success || !productsResponse.data.data.products) {
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
      } else {
        console.log('❌ 状态更新验证失败');
      }
    } else {
      console.log('❌ 产品状态更新失败:', updateResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API错误:', error.response.status, error.response.data);
      if (error.response.status === 404) {
        console.log('🔍 404错误说明API路由不存在或有问题');
      }
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

testProductStatusUpdate();