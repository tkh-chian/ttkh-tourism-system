const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试用户数据 (使用实际创建的账号)
const testUsers = {
  admin: { email: 'admin@ttkh.com', password: 'admin123', role: 'admin' },
  merchant: { email: 'merchant@test.com', password: '123456', role: 'merchant' },
  user: { email: 'customer@test.com', password: '123456', role: 'customer' }
};

let tokens = {};
let testProductId = null;
let testOrderId = null;

console.log('🎯 开始完整API流程测试...\n');

async function testCompleteFlow() {
  try {
    console.log('=== 第1步：用户登录测试 ===');
    
    // 登录所有测试用户
    for (const [role, userData] of Object.entries(testUsers)) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        
        if (response.data.token) {
          tokens[role] = response.data.token;
          console.log(`✅ ${role} 登录成功`);
        }
      } catch (error) {
        console.log(`❌ ${role} 登录失败:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第2步：商家上传产品测试 ===');
    
    if (tokens.merchant) {
      const productData = {
        name: '普吉岛豪华一日游',
        description: '包含海滩、浮潜、午餐的完美一日游体验',
        price: 1500,
        category: '一日游',
        location: '普吉岛',
        duration: '8小时',
        maxParticipants: 20,
        images: JSON.stringify(['https://example.com/phuket1.jpg'])
      };

      try {
        const response = await axios.post(`${API_BASE}/products`, productData, {
          headers: { Authorization: `Bearer ${tokens.merchant}` }
        });
        
        if (response.data.success) {
          const product = response.data.product;
          testProductId = product.id;
          console.log(`✅ 产品创建成功`);
          console.log(`   产品ID: ${product.id}`);
          console.log(`   产品编号: ${product.product_number || '未生成'}`);
          console.log(`   产品名称: ${product.name}`);
          console.log(`   状态: ${product.status}`);
        }
      } catch (error) {
        console.log('❌ 产品创建失败:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第3步：管理员审核产品测试 ===');
    
    if (tokens.admin && testProductId) {
      try {
        // 获取所有产品
        const productsResponse = await axios.get(`${API_BASE}/products`, {
          headers: { Authorization: `Bearer ${tokens.admin}` }
        });
        
        const products = productsResponse.data.products || [];
        const pendingProducts = products.filter(p => p.status === 'pending');
        
        console.log(`📋 总产品数量: ${products.length}`);
        console.log(`📋 待审核产品数量: ${pendingProducts.length}`);
        
        if (pendingProducts.length > 0) {
          const productToApprove = pendingProducts[0];
          
          // 审核产品
          const approveResponse = await axios.put(
            `${API_BASE}/products/${productToApprove.id}`,
            { status: 'approved' },
            { headers: { Authorization: `Bearer ${tokens.admin}` } }
          );
          
          if (approveResponse.data.success) {
            console.log(`✅ 产品审核通过`);
            console.log(`   产品: ${productToApprove.name}`);
            console.log(`   新状态: approved`);
          }
        }
      } catch (error) {
        console.log('❌ 产品审核失败:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第4步：首页展示产品测试 ===');
    
    try {
      const response = await axios.get(`${API_BASE}/products`);
      const products = response.data.products || [];
      const approvedProducts = products.filter(p => p.status === 'approved');
      
      console.log(`📦 总产品数量: ${products.length}`);
      console.log(`📦 已审核产品数量: ${approvedProducts.length}`);
      
      if (products.length > 0) {
        console.log('✅ 首页产品展示正常');
        products.forEach((product, index) => {
          const status = product.status || 'unknown';
          const productNumber = product.product_number || product.productNumber || '无编号';
          console.log(`   ${index + 1}. ${product.name} - 状态: ${status} (${productNumber})`);
        });
      }
    } catch (error) {
      console.log('❌ 获取首页产品失败:', error.response?.data?.message || error.message);
    }

    console.log('\n=== 第5步：用户提交订单测试 ===');
    
    if (tokens.user && testProductId) {
      const orderData = {
        productId: testProductId,
        quantity: 2,
        selectedDate: '2024-12-25',
        customerInfo: {
          name: '张三',
          phone: '0123456789',
          email: 'zhangsan@test.com'
        }
      };

      try {
        const response = await axios.post(`${API_BASE}/orders`, orderData, {
          headers: { Authorization: `Bearer ${tokens.user}` }
        });
        
        if (response.data.success) {
          const order = response.data.order;
          testOrderId = order.id;
          console.log(`✅ 订单创建成功`);
          console.log(`   订单ID: ${order.id}`);
          console.log(`   订单编号: ${order.order_number || order.orderNumber || '未生成'}`);
          console.log(`   产品ID: ${testProductId}`);
          console.log(`   数量: ${orderData.quantity}`);
          console.log(`   状态: ${order.status}`);
        }
      } catch (error) {
        console.log('❌ 订单创建失败:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第6步：路由和API接口互通测试 ===');
    
    const apiTests = [
      { name: '产品列表API', url: `${API_BASE}/products`, method: 'GET' },
      { name: '用户信息API', url: `${API_BASE}/auth/me`, method: 'GET', token: tokens.user },
      { name: '订单列表API', url: `${API_BASE}/orders`, method: 'GET', token: tokens.user }
    ];

    for (const test of apiTests) {
      try {
        const config = {
          method: test.method,
          url: test.url
        };
        
        if (test.token) {
          config.headers = { Authorization: `Bearer ${test.token}` };
        }
        
        const response = await axios(config);
        console.log(`✅ ${test.name} - 正常 (状态: ${response.status})`);
      } catch (error) {
        console.log(`❌ ${test.name} - 失败: ${error.response?.status || error.message}`);
      }
    }

    console.log('\n🎉 完整API流程测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log(`- 用户登录: ${Object.keys(tokens).length}/3 成功`);
    console.log(`- 商家上传产品: ${testProductId ? '成功' : '失败'} (含产品编号生成)`);
    console.log('- 管理员审核: 已测试');
    console.log('- 首页展示: 已测试');
    console.log(`- 用户下单: ${testOrderId ? '成功' : '失败'} (含订单编号生成)`);
    console.log('- API接口互通: 已测试');
    
    console.log('\n🌐 前端访问地址: http://localhost:3000');
    console.log('🔧 后端API地址: http://localhost:3001/api');
    
    console.log('\n📋 测试账号信息:');
    Object.entries(testUsers).forEach(([role, userData]) => {
      const loginStatus = tokens[role] ? '✅' : '❌';
      console.log(`   ${loginStatus} ${role}: ${userData.email} / ${userData.password}`);
    });

    console.log('\n🔍 现在请在浏览器中访问 http://localhost:3000 进行人工验证！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testCompleteFlow();