/**
 * 简单API测试脚本 - 测试订单创建
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// 测试用户凭据
const TEST_USER = { email: 'customer@ttkh.com', password: 'customer123' };

// 存储测试数据
const testData = {
  token: null,
  productId: null
};

// 日志函数
const log = (message, type = 'info') => {
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '🔄',
    debug: '🔍'
  }[type] || '📝';
  
  console.log(`${prefix} ${message}`);
};

// 错误处理函数
const handleError = (error, step) => {
  log(`${step} 失败: ${error.message}`, 'error');
  if (error.response) {
    log(`状态码: ${error.response.status}`, 'error');
    log(`响应数据: ${JSON.stringify(error.response.data)}`, 'error');
  }
  return error;
};

// 登录函数
async function login() {
  try {
    log('正在登录...', 'step');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    testData.token = response.data.token;
    log('登录成功', 'success');
    return response.data;
  } catch (error) {
    throw handleError(error, '登录');
  }
}

// 获取产品列表
async function getProducts() {
  try {
    log('正在获取产品列表...', 'step');
    const response = await axios.get(
      `${API_BASE_URL}/products`,
      { headers: { Authorization: `Bearer ${testData.token}` } }
    );
    
    const products = response.data.data.products || [];
    if (products.length > 0) {
      testData.productId = products[0].id;
      log(`获取到产品，使用第一个产品ID: ${testData.productId}`, 'success');
    } else {
      log('没有找到可用产品', 'warning');
    }
    
    return products;
  } catch (error) {
    throw handleError(error, '获取产品列表');
  }
}

// 获取产品价格调度
async function getProductSchedules(productId) {
  try {
    log(`正在获取产品 ${productId} 的价格调度...`, 'step');
    const response = await axios.get(
      `${API_BASE_URL}/products/${productId}/schedules`,
      { 
        headers: { Authorization: `Bearer ${testData.token}` },
        timeout: 10000 // 添加10秒超时
      }
    );
    
    // 检查响应数据结构
    log(`价格调度API响应: ${JSON.stringify(response.data)}`, 'debug');
    
    // 处理不同的数据结构
    let schedules = [];
    if (response.data.data && Array.isArray(response.data.data.schedules)) {
      schedules = response.data.data.schedules;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      schedules = response.data.data;
    } else if (Array.isArray(response.data.schedules)) {
      schedules = response.data.schedules;
    } else if (Array.isArray(response.data)) {
      schedules = response.data;
    }
    
    log(`获取到 ${schedules.length} 条价格调度记录`, 'success');
    
    if (schedules.length > 0) {
      // 找到第一个有库存的日期
      const availableSchedule = schedules.find(s => s.available_stock > 0);
      if (availableSchedule) {
        // 标准化日期字段
        const dateValue = availableSchedule.date || 
                         (availableSchedule.travel_date ? 
                           (availableSchedule.travel_date.includes('T') ? 
                             availableSchedule.travel_date.split('T')[0] : 
                             availableSchedule.travel_date) : 
                           null);
                           
        log(`找到可用日期: ${dateValue}, 价格: ${availableSchedule.price}, 库存: ${availableSchedule.available_stock}`, 'success');
        
        // 标准化schedule对象，确保有date属性
        return {
          ...availableSchedule,
          date: dateValue
        };
      } else {
        log('没有找到有库存的日期', 'warning');
      }
    }
    
    return null;
  } catch (error) {
    throw handleError(error, '获取价格调度');
  }
}

// 创建订单 - 修复版本
async function createOrder(productId, schedule) {
  try {
    log('正在创建订单...', 'step');
    
    // 获取产品详情以获取merchant_id和product_title
    const productResponse = await axios.get(
      `${API_BASE_URL}/products/${productId}`,
      { 
        headers: { Authorization: `Bearer ${testData.token}` },
        timeout: 10000 // 添加10秒超时
      }
    );
    
    log(`产品详情API响应: ${JSON.stringify(productResponse.data)}`, 'debug');
    
    // 处理不同的数据结构
    let product = null;
    if (productResponse.data.data && productResponse.data.data.product) {
      product = productResponse.data.data.product;
    } else if (productResponse.data.data) {
      product = productResponse.data.data;
    } else if (productResponse.data.product) {
      product = productResponse.data.product;
    }
    
    if (!product) {
      throw new Error('无法获取产品详情');
    }
    
    const adults = 2;
    const total_price = adults * schedule.price;
    
    // 确保日期字段存在
    if (!schedule.date) {
      throw new Error('价格调度中缺少日期字段');
    }
    
    // 构建完整的订单数据，包括所有必填字段
    const orderData = {
      product_id: productId,
      merchant_id: product.merchant_id, // 添加商家ID
      product_title: product.title_zh || product.name, // 添加产品标题
      travel_date: schedule.date, // 使用标准化后的日期
      adults: adults,
      children_no_bed: 0,
      children_with_bed: 0,
      total_people: adults, // 添加总人数
      unit_price: schedule.price, // 添加单价
      total_price: total_price,
      customer_name: '测试用户',
      customer_phone: '13800138000',
      customer_email: 'test@example.com',
      notes: '简单API测试订单'
    };
    
    log(`订单数据: ${JSON.stringify(orderData)}`, 'debug');
    
    const response = await axios.post(
      `${API_BASE_URL}/orders`,
      orderData,
      { 
        headers: { Authorization: `Bearer ${testData.token}` },
        timeout: 15000 // 添加15秒超时
      }
    );
    
    log(`订单创建API响应: ${JSON.stringify(response.data)}`, 'debug');
    
    // 处理不同的响应格式
    let orderInfo = {};
    if (response.data.data && response.data.data.order) {
      orderInfo = response.data.data.order;
    } else if (response.data.data) {
      orderInfo = response.data.data;
    }
    
    log('订单创建成功', 'success');
    log(`订单ID: ${orderInfo.id || orderInfo.orderId}`, 'success');
    log(`订单编号: ${orderInfo.order_number || orderInfo.orderNumber}`, 'success');
    
    return response.data;
  } catch (error) {
    throw handleError(error, '创建订单');
  }
}

// 主测试流程
async function runTest() {
  log('开始API测试', 'info');
  log('------------------------', 'info');
  
  try {
    // 设置全局超时
    axios.defaults.timeout = 30000; // 30秒全局超时
    
    // 登录
    await login();
    
    // 获取产品列表
    const products = await getProducts();
    if (!testData.productId) {
      throw new Error('没有可用的产品进行测试');
    }
    
    // 获取产品价格调度
    const schedule = await getProductSchedules(testData.productId);
    if (!schedule) {
      throw new Error('没有可用的价格调度进行测试');
    }
    
    // 创建订单
    await createOrder(testData.productId, schedule);
    
    log('------------------------', 'info');
    log('API测试完成', 'success');
    process.exit(0); // 正常退出
    
  } catch (error) {
    log('测试过程中出现错误', 'error');
    log(error.message, 'error');
    process.exit(1); // 错误退出
  }
}

// 执行测试
runTest();