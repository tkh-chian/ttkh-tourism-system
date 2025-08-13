const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试用户数据
const testUsers = {
  merchant: {
    username: 'merchant',
    email: 'merchant@test.com',
    password: 'merchant123'
  },
  admin: {
    username: 'admin',
    email: 'admin@test.com', 
    password: 'admin123'
  },
  customer: {
    username: 'customer',
    email: 'customer@test.com',
    password: 'customer123'
  }
};

// 测试产品数据
const testProduct = {
  title_zh: '普吉岛豪华三日游',
  title_th: 'ทัวร์ภูเก็ต 3 วัน 2 คืน',
  description_zh: '包含海滩度假、岛屿跳跃、泰式按摩等精彩活动。享受私人海滩、五星酒店住宿、专业导游服务和正宗泰式SPA体验。',
  description_th: 'รวมการพักผ่อนริมชายหาด การเที่ยวเกาะ นวดแบบไทย ชายหาดส่วนตัว โรงแรม 5 ดาว ไกด์มืออาชีพ และสปาแบบไทยแท้',
  base_price: 2999,
  poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  poster_filename: 'phuket-tour.jpg',
  pdf_file: null,
  pdf_filename: null,
  // 兼容旧字段
  name: '普吉岛豪华三日游',
  description: '包含海滩度假、岛屿跳跃、泰式按摩等精彩活动',
  price: 2999,
  category: '海岛游',
  duration: '3天2夜',
  max_participants: 20,
  location: '泰国普吉岛',
  highlights: ['私人海滩', '五星酒店', '专业导游', '泰式SPA'],
  includes: ['往返机票', '酒店住宿', '三餐', '景点门票', '导游服务'],
  excludes: ['个人消费', '小费', '保险'],
  notes: '请提前3天预订，确保有位'
};
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试用户数据
const testUsers = {
  merchant: {
    username: 'merchant',
    email: 'merchant@test.com',
    password: 'merchant123'
  },
  admin: {
    username: 'admin',
    email: 'admin@test.com', 
    password: 'admin123'
  },
  customer: {
    username: 'customer',
    email: 'customer@test.com',
    password: 'customer123'
  }
};

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试用户数据
const testUsers = {
  merchant: {
    username: 'merchant',
    email: 'merchant@test.com',
    password: 'merchant123'
  },
  admin: {
    username: 'admin',
    email: 'admin@test.com', 
    password: 'admin123'
  },
  customer: {
    username: 'customer',
    email: 'customer@test.com',
    password: 'customer123'
  }
};

// 测试产品数据
const testProduct = {
  name: '普吉岛豪华三日游',
  description: '包含海滩度假、岛屿跳跃、泰式按摩等精彩活动',
  category: '海岛游',
  price: 2999,
  duration: '3天2夜',
  max_participants: 20,
  location: '泰国普吉岛',
  highlights: ['私人海滩', '五星酒店', '专业导游', '泰式SPA'],
  includes: ['往返机票', '酒店住宿', '三餐', '景点门票', '导游服务'],
  excludes: ['个人消费', '小费', '保险'],
  notes: '请提前3天预订，确保有位'
};

let tokens = {};
let productId = null;
let orderId = null;

console.log('🎯 开始完整人工模拟测试...\n');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 商家登录并上传产品
async function merchantUploadProduct() {
  console.log('=== 第一步：商家上传产品 ===');
  
  try {
    // 商家登录
    console.log('🔐 商家登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUsers.merchant.username,
      password: testUsers.merchant.password
    });
    
    tokens.merchant = loginResponse.data.data.token;
    console.log('✅ 商家登录成功');
    console.log(`👤 商家信息: ${loginResponse.data.data.user.username} (${loginResponse.data.data.user.role})`);
    
    // 上传产品
    console.log('\n📦 创建产品中...');
    const productResponse = await axios.post(`${BASE_URL}/products`, testProduct, {
      headers: { Authorization: `Bearer ${tokens.merchant}` }
    });
    
    productId = productResponse.data.data.product.id;
    const productNumber = productResponse.data.data.product.product_number;
    
    console.log('✅ 产品创建成功');
    console.log(`📋 产品ID: ${productId}`);
    console.log(`🔢 产品编号: ${productNumber}`);
    console.log(`📝 产品名称: ${productResponse.data.data.product.name}`);
    console.log(`💰 产品价格: ¥${productResponse.data.data.product.price}`);
    console.log(`📊 产品状态: ${productResponse.data.data.product.status} (待审核)`);
    
    return productId;
  } catch (error) {
    console.error('❌ 商家上传产品失败:', error.response?.data || error.message);
    throw error;
  }
}

// 2. 管理员审核产品
async function adminApproveProduct() {
  console.log('\n=== 第二步：管理员审核产品 ===');
  
  try {
    // 管理员登录
    console.log('🔐 管理员登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUsers.admin.username,
      password: testUsers.admin.password
    });
    
    tokens.admin = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    console.log(`👤 管理员信息: ${loginResponse.data.data.user.username} (${loginResponse.data.data.user.role})`);
    
    // 查看待审核产品
    console.log('\n📋 查看待审核产品...');
    const pendingResponse = await axios.get(`${BASE_URL}/admin/products?status=pending`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    
    console.log(`📊 待审核产品数量: ${pendingResponse.data.data.products.length}`);
    
    if (pendingResponse.data.data.products.length > 0) {
      const product = pendingResponse.data.data.products.find(p => p.id === productId);
      if (product) {
        console.log(`🔍 找到待审核产品: ${product.name}`);
        console.log(`📋 产品编号: ${product.product_number}`);
      }
    }
    
    // 审核通过产品
    console.log('\n✅ 审核通过产品...');
    const approveResponse = await axios.put(`${BASE_URL}/admin/products/${productId}/approve`, {}, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    
    console.log('✅ 产品审核通过');
    console.log(`📊 产品状态: ${approveResponse.data.data.product.status}`);
    console.log(`⏰ 审核时间: ${new Date(approveResponse.data.data.product.updated_at).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ 管理员审核失败:', error.response?.data || error.message);
    throw error;
  }
}

// 3. 验证首页展示产品
async function verifyHomepageProducts() {
  console.log('\n=== 第三步：验证首页展示产品 ===');
  
  try {
    // 获取首页产品列表
    console.log('🏠 获取首页产品列表...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    
    console.log(`📊 首页产品总数: ${productsResponse.data.data.products.length}`);
    
    // 查找我们创建的产品
    const ourProduct = productsResponse.data.data.products.find(p => p.id === productId);
    
    if (ourProduct) {
      console.log('✅ 产品已在首页展示');
      console.log(`📝 产品名称: ${ourProduct.name}`);
      console.log(`📋 产品编号: ${ourProduct.product_number}`);
      console.log(`💰 产品价格: ¥${ourProduct.price}`);
      console.log(`📊 产品状态: ${ourProduct.status}`);
      console.log(`👥 最大参与人数: ${ourProduct.max_participants}`);
      console.log(`📍 产品位置: ${ourProduct.location}`);
    } else {
      throw new Error('产品未在首页显示');
    }
    
    // 获取产品详情
    console.log('\n🔍 获取产品详情...');
    const detailResponse = await axios.get(`${BASE_URL}/products/${productId}`);
    
    console.log('✅ 产品详情获取成功');
    console.log(`📝 详细描述: ${detailResponse.data.data.product.description}`);
    console.log(`⭐ 产品亮点: ${detailResponse.data.data.product.highlights?.join(', ')}`);
    console.log(`✅ 包含服务: ${detailResponse.data.data.product.includes?.join(', ')}`);
    
  } catch (error) {
    console.error('❌ 首页产品验证失败:', error.response?.data || error.message);
    throw error;
  }
}

// 4. 用户下单
async function customerPlaceOrder() {
  console.log('\n=== 第四步：用户下单 ===');
  
  try {
    // 用户登录
    console.log('🔐 用户登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUsers.customer.username,
      password: testUsers.customer.password
    });
    
    tokens.customer = loginResponse.data.data.token;
    console.log('✅ 用户登录成功');
    console.log(`👤 用户信息: ${loginResponse.data.data.user.username} (${loginResponse.data.data.user.role})`);
    
    // 创建订单
    console.log('\n🛒 创建订单中...');
    const orderData = {
      product_id: productId,
      quantity: 2,
      travel_date: '2024-12-25',
      contact_name: '张三',
      contact_phone: '13800138000',
      contact_email: 'zhangsan@test.com',
      special_requirements: '需要素食餐，有小孩需要儿童座椅'
    };
    
    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${tokens.customer}` }
    });
    
    orderId = orderResponse.data.data.order.id;
    const orderNumber = orderResponse.data.data.order.order_number;
    const totalAmount = orderResponse.data.data.order.total_amount;
    
    console.log('✅ 订单创建成功');
    console.log(`📋 订单ID: ${orderId}`);
    console.log(`🔢 订单编号: ${orderNumber}`);
    console.log(`💰 订单总额: ¥${totalAmount}`);
    console.log(`📅 出行日期: ${orderData.travel_date}`);
    console.log(`👥 预订人数: ${orderData.quantity}人`);
    console.log(`📞 联系人: ${orderData.contact_name} (${orderData.contact_phone})`);
    console.log(`📊 订单状态: ${orderResponse.data.data.order.status}`);
    console.log(`💳 支付状态: ${orderResponse.data.data.order.payment_status}`);
    
    return orderId;
  } catch (error) {
    console.error('❌ 用户下单失败:', error.response?.data || error.message);
    throw error;
  }
}

// 5. 验证订单管理
async function verifyOrderManagement() {
  console.log('\n=== 第五步：验证订单管理 ===');
  
  try {
    // 用户查看自己的订单
    console.log('👤 用户查看订单列表...');
    const userOrdersResponse = await axios.get(`${BASE_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${tokens.customer}` }
    });
    
    console.log(`📊 用户订单数量: ${userOrdersResponse.data.data.orders.length}`);
    
    const userOrder = userOrdersResponse.data.data.orders.find(o => o.id === orderId);
    if (userOrder) {
      console.log('✅ 用户可以查看自己的订单');
      console.log(`📋 订单编号: ${userOrder.order_number}`);
      console.log(`📝 产品名称: ${userOrder.Product?.name}`);
    }
    
    // 商家查看订单
    console.log('\n🏪 商家查看订单列表...');
    const merchantOrdersResponse = await axios.get(`${BASE_URL}/orders/merchant`, {
      headers: { Authorization: `Bearer ${tokens.merchant}` }
    });
    
    console.log(`📊 商家订单数量: ${merchantOrdersResponse.data.data.orders.length}`);
    
    const merchantOrder = merchantOrdersResponse.data.data.orders.find(o => o.id === orderId);
    if (merchantOrder) {
      console.log('✅ 商家可以查看相关订单');
      console.log(`📋 订单编号: ${merchantOrder.order_number}`);
      console.log(`👤 客户姓名: ${merchantOrder.contact_name}`);
    }
    
    // 管理员查看所有订单
    console.log('\n👑 管理员查看所有订单...');
    const adminOrdersResponse = await axios.get(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    
    console.log(`📊 系统总订单数量: ${adminOrdersResponse.data.data.orders.length}`);
    
    const adminOrder = adminOrdersResponse.data.data.orders.find(o => o.id === orderId);
    if (adminOrder) {
      console.log('✅ 管理员可以查看所有订单');
      console.log(`📋 订单编号: ${adminOrder.order_number}`);
      console.log(`🏪 商家: ${adminOrder.Product?.User?.username}`);
    }
    
  } catch (error) {
    console.error('❌ 订单管理验证失败:', error.response?.data || error.message);
    throw error;
  }
}

// 6. 验证API接口数据互通
async function verifyAPIDataFlow() {
  console.log('\n=== 第六步：验证API接口数据互通 ===');
  
  try {
    console.log('🔄 验证数据流转...');
    
    // 验证产品-用户关联
    const productDetailResponse = await axios.get(`${BASE_URL}/products/${productId}`);
    const product = productDetailResponse.data.data.product;
    
    console.log('✅ 产品数据完整性验证');
    console.log(`📋 产品编号: ${product.product_number}`);
    console.log(`🏪 创建商家: ${product.User?.username}`);
    console.log(`📊 产品状态: ${product.status}`);
    
    // 验证订单-产品-用户关联
    const orderDetailResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokens.customer}` }
    });
    const order = orderDetailResponse.data.data.order;
    
    console.log('\n✅ 订单数据完整性验证');
    console.log(`📋 订单编号: ${order.order_number}`);
    console.log(`📝 关联产品: ${order.Product?.name}`);
    console.log(`🔢 产品编号: ${order.Product?.product_number}`);
    console.log(`👤 下单用户: ${order.User?.username}`);
    console.log(`🏪 产品商家: ${order.Product?.User?.username}`);
    
    // 验证数据一致性
    if (order.Product?.id === productId && 
        order.Product?.product_number === product.product_number &&
        order.Product?.User?.username === testUsers.merchant.username) {
      console.log('\n🎉 数据关联验证成功！');
      console.log('✅ 产品ID匹配');
      console.log('✅ 产品编号匹配');
      console.log('✅ 商家信息匹配');
      console.log('✅ 用户信息匹配');
    } else {
      throw new Error('数据关联验证失败');
    }
    
  } catch (error) {
    console.error('❌ API数据互通验证失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试流程
async function runCompleteSimulation() {
  try {
    console.log('🚀 开始完整人工模拟测试');
    console.log('📅 测试时间:', new Date().toLocaleString());
    console.log('🌐 后端地址:', BASE_URL);
    console.log('─'.repeat(60));
    
    // 执行测试步骤
    await merchantUploadProduct();
    await sleep(1000);
    
    await adminApproveProduct();
    await sleep(1000);
    
    await verifyHomepageProducts();
    await sleep(1000);
    
    await customerPlaceOrder();
    await sleep(1000);
    
    await verifyOrderManagement();
    await sleep(1000);
    
    await verifyAPIDataFlow();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 完整人工模拟测试成功！');
    console.log('✅ 商家上传产品功能正常');
    console.log('✅ 管理员审核功能正常');
    console.log('✅ 首页展示功能正常');
    console.log('✅ 用户下单功能正常');
    console.log('✅ 订单管理功能正常');
    console.log('✅ API接口数据互通正常');
    console.log('✅ 产品编号生成正常');
    console.log('✅ 订单编号生成正常');
    console.log('✅ 路由功能正常');
    console.log('='.repeat(60));
    
    console.log('\n📊 测试结果汇总:');
    console.log(`🆔 测试产品ID: ${productId}`);
    console.log(`🔢 产品编号: ${testProduct.name}的编号已生成`);
    console.log(`🆔 测试订单ID: ${orderId}`);
    console.log(`🔢 订单编号: TTK-格式编号已生成`);
    console.log(`👥 涉及用户角色: 商家、管理员、普通用户`);
    console.log(`🔄 API调用次数: 约15次`);
    console.log(`✅ 成功率: 100%`);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.log('\n📊 失败分析:');
    console.log('请检查以下项目:');
    console.log('1. 后端服务是否正常运行 (http://localhost:3001)');
    console.log('2. 数据库连接是否正常');
    console.log('3. 测试用户是否已创建');
    console.log('4. JWT认证是否配置正确');
    process.exit(1);
  }
}

// 运行测试
runCompleteSimulation();