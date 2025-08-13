const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';

// 测试用户数据
const testUsers = {
  admin: { email: 'admin@test.com', password: 'admin123', role: 'admin' },
  merchant: { email: 'merchant@test.com', password: 'merchant123', role: 'merchant' },
  user: { email: 'user@test.com', password: 'user123', role: 'user' }
};

// 存储token
let tokens = {};

console.log('🎯 开始完整人工模拟测试...\n');

async function simulateCompleteFlow() {
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
        images: ['https://example.com/phuket1.jpg', 'https://example.com/phuket2.jpg']
      };

      try {
        const response = await axios.post(`${API_BASE}/products`, productData, {
          headers: { Authorization: `Bearer ${tokens.merchant}` }
        });
        
        if (response.data.success) {
          const product = response.data.product;
          console.log(`✅ 产品创建成功`);
          console.log(`   产品编号: ${product.productNumber}`);
          console.log(`   产品名称: ${product.name}`);
          console.log(`   状态: ${product.status}`);
          
          // 保存产品ID用于后续测试
          global.testProductId = product.id;
        }
      } catch (error) {
        console.log('❌ 产品创建失败:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第3步：管理员审核产品测试 ===');
    
    if (tokens.admin && global.testProductId) {
      try {
        // 获取待审核产品
        const productsResponse = await axios.get(`${API_BASE}/admin/products/pending`, {
          headers: { Authorization: `Bearer ${tokens.admin}` }
        });
        
        console.log(`📋 待审核产品数量: ${productsResponse.data.products?.length || 0}`);
        
        if (productsResponse.data.products?.length > 0) {
          // 审核第一个产品
          const productToApprove = productsResponse.data.products[0];
          const approveResponse = await axios.put(
            `${API_BASE}/admin/products/${productToApprove.id}/approve`,
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
      const approvedProducts = response.data.products?.filter(p => p.status === 'approved') || [];
      
      console.log(`📦 首页展示产品数量: ${approvedProducts.length}`);
      
      if (approvedProducts.length > 0) {
        console.log('✅ 首页产品展示正常');
        approvedProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (${product.productNumber})`);
        });
        
        // 保存第一个产品用于订单测试
        global.testApprovedProduct = approvedProducts[0];
      } else {
        console.log('⚠️  首页暂无已审核产品');
      }
    } catch (error) {
      console.log('❌ 获取首页产品失败:', error.response?.data?.message || error.message);
    }

    console.log('\n=== 第5步：用户提交订单测试 ===');
    
    if (tokens.user && global.testApprovedProduct) {
      const orderData = {
        productId: global.testApprovedProduct.id,
        quantity: 2,
        selectedDate: '2024-12-25',
        customerInfo: {
          name: '张三',
          phone: '0123456789',
          email: 'zhangsan@test.com'
        },
        totalAmount: global.testApprovedProduct.price * 2
      };

      try {
        const response = await axios.post(`${API_BASE}/orders`, orderData, {
          headers: { Authorization: `Bearer ${tokens.user}` }
        });
        
        if (response.data.success) {
          const order = response.data.order;
          console.log(`✅ 订单创建成功`);
          console.log(`   订单编号: ${order.orderNumber}`);
          console.log(`   产品: ${global.testApprovedProduct.name}`);
          console.log(`   数量: ${orderData.quantity}`);
          console.log(`   总金额: ${orderData.totalAmount} THB`);
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
      { name: '商家产品API', url: `${API_BASE}/merchant/products`, method: 'GET', token: tokens.merchant },
      { name: '管理员用户API', url: `${API_BASE}/admin/users`, method: 'GET', token: tokens.admin }
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
        console.log(`✅ ${test.name} - 正常`);
      } catch (error) {
        console.log(`❌ ${test.name} - 失败: ${error.response?.status || error.message}`);
      }
    }

    console.log('\n🎉 完整人工模拟测试完成！');
    console.log('\n📊 测试总结:');
    console.log('- 用户登录: 已测试');
    console.log('- 商家上传产品: 已测试 (含产品编号生成)');
    console.log('- 管理员审核: 已测试');
    console.log('- 首页展示: 已测试');
    console.log('- 用户下单: 已测试 (含订单编号生成)');
    console.log('- API接口互通: 已测试');
    
    console.log('\n🌐 前端访问地址: http://localhost:3000');
    console.log('🔧 后端API地址: http://localhost:3001/api');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
simulateCompleteFlow();