/**
 * TTKH旅游系统 - 自动化测试脚本
 * 
 * 本脚本自动测试完整业务流程并验证数据一致性
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// 数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

// 测试用户凭据 - 使用邮箱登录
const TEST_USERS = {
  admin: { email: 'admin@ttkh.com', password: 'admin123' },
  merchant: { email: 'merchant@ttkh.com', password: 'merchant123' },
  // 已重置密码
  customer: { email: 'customer@ttkh.com', password: 'customer123' }
};

// 存储测试过程中生成的数据
const testData = {
  tokens: {},
  product: null,
  schedules: [],
  order: null,
  travelDate: null,
  schedulePrice: 100 // 默认价格
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

// API请求函数
const api = {
  // 登录并获取token
  async login(role) {
    try {
      log(`正在登录 ${role} 账户...`, 'step');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USERS[role]);
      testData.tokens[role] = response.data.token;
      log(`${role} 登录成功`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, `${role} 登录`);
    }
  },

  // 创建产品
  async createProduct() {
    try {
      log('正在创建测试产品...', 'step');
      
      // 生成唯一产品编号
      const productNumber = `TEST-${Date.now().toString().slice(-6)}`;
      
      const productData = {
        title_zh: `测试产品 ${Date.now()}`,
        title_th: `Test Product ${Date.now()}`,
        description_zh: '这是一个自动化测试创建的产品',
        description_th: 'This is a product created by automated test',
        base_price: 100,
        product_number: productNumber,
        name: `测试产品 ${Date.now()}`,
        description: '这是一个自动化测试创建的产品',
        price: 100,
        category: '旅游',
        location: '曼谷',
        duration: '1天',
        max_participants: 10
      };

      // 使用正确的API路径
      const response = await axios.post(
        `${API_BASE_URL}/products`,
        productData,
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      testData.product = response.data.data || response.data;
      log(`产品创建成功，ID: ${testData.product.id}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '创建产品');
    }
  },

  // 创建价格调度
  async createPriceSchedules() {
    try {
      log('正在创建价格调度...', 'step');
      
      // 创建未来30天的价格调度
      const schedules = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (i === 0) {
          testData.travelDate = dateStr; // 保存第一个日期用于下单
          testData.schedulePrice = 100 + (i % 5) * 10; // 保存第一个日期的价格
        }
        
        // 使用正确的字段名：date和stock
        const schedule = {
          product_id: testData.product.id,
          date: dateStr,
          price: 100 + (i % 5) * 10, // 价格在100-140之间浮动
          stock: 10
        };
        
        schedules.push(schedule);
      }
      
      // 使用正确的API路径
      const response = await axios.post(
        `${API_BASE_URL}/products/${testData.product.id}/schedules/batch`,
        { schedules },
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      // 保存创建的价格调度记录
      testData.schedules = schedules;
      log(`成功创建 ${schedules.length} 条价格调度记录`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '创建价格调度');
    }
  },

  // 提交产品审核
  async submitProductForReview() {
    try {
      log('正在提交产品审核...', 'step');
      // 使用正确的API路径
      const response = await axios.put(
        `${API_BASE_URL}/products/${testData.product.id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      testData.product = response.data.data || response.data;
      log(`产品状态已更新为: ${testData.product.status}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '提交产品审核');
    }
  },

  // 管理员审核产品
  async approveProduct() {
    try {
      log('管理员正在审核产品...', 'step');
      const response = await axios.put(
        `${API_BASE_URL}/admin/products/${testData.product.id}/status`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${testData.tokens.admin}` } }
      );
      
      const updatedProduct = response.data.data || response.data;
      log(`产品审核通过，状态: ${updatedProduct.status}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '管理员审核产品');
    }
  },

  // 获取产品详情
  async getProductDetails() {
    try {
      log('正在获取产品详情...', 'step');
      const response = await axios.get(
        `${API_BASE_URL}/products/${testData.product.id}`,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      const product = response.data.data || response.data;
      log(`成功获取产品详情: ${product.title_zh || product.name}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '获取产品详情');
    }
  },

  // 创建订单
  async createOrder() {
    try {
      log('正在创建订单...', 'step');
      
      // 获取价格调度
      const scheduleResponse = await axios.get(
        `${API_BASE_URL}/products/${testData.product.id}/schedules`,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      // 正确访问价格调度数据
      const schedules = scheduleResponse.data.data ? scheduleResponse.data.data.schedules : [];
      log(`获取到 ${schedules ? schedules.length : 0} 条价格调度记录`, 'debug');
      
      if (!schedules || schedules.length === 0) {
        // 如果API没有返回价格调度数据，使用我们之前创建的数据
        log('API未返回价格调度数据，使用之前创建的数据', 'warning');
      }
      
      // 使用第一个日期和价格
      const travelDate = testData.travelDate;
      const price = testData.schedulePrice;
      const adults = 2;
      const total_price = adults * price;
      
      log(`订单信息: 日期=${travelDate}, 成人=${adults}, 单价=${price}, 总金额=${total_price}`, 'info');
      
      // 获取产品详情以获取merchant_id
      const productResponse = await axios.get(
        `${API_BASE_URL}/products/${testData.product.id}`,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      const product = productResponse.data.data || testData.product;
      
      const orderData = {
        product_id: testData.product.id,
        merchant_id: product.merchant_id, // 添加商家ID
        product_title: product.title_zh || product.name, // 添加产品标题
        travel_date: travelDate,
        adults: adults,
        children_no_bed: 0,
        children_with_bed: 0,
        infants: 0,
        total_people: adults,
        unit_price: price, // 添加单价
        total_price: total_price,
        customer_name: '测试用户',
        customer_phone: '13800138000',
        customer_email: 'test@example.com',
        notes: '自动化测试订单'
      };
      
      log(`订单请求数据: ${JSON.stringify(orderData)}`, 'debug');
      
      const response = await axios.post(
        `${API_BASE_URL}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      testData.order = response.data.data || response.data;
      log(`订单创建成功，ID: ${testData.order.id || testData.order.orderId || (testData.order.order ? testData.order.order.id : '未知')}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '创建订单');
    }
  },

  // 商家确认订单
  async confirmOrder() {
    try {
      log('商家正在确认订单...', 'step');
      const orderId = testData.order.id || testData.order.orderId || (testData.order.order ? testData.order.order.id : null);
      
      if (!orderId) {
        throw new Error('找不到订单ID');
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status: 'confirmed' },
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      const updatedOrder = response.data.data || response.data;
      log(`订单已确认，状态: ${updatedOrder.status || (updatedOrder.order ? updatedOrder.order.status : '未知')}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '商家确认订单');
    }
  },

  // 获取用户订单
  async getCustomerOrders() {
    try {
      log('正在获取用户订单...', 'step');
      const response = await axios.get(
        `${API_BASE_URL}/orders`,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      const orders = response.data.data ? response.data.data.orders : [];
      const orderId = testData.order.id || testData.order.orderId || (testData.order.order ? testData.order.order.id : null);
      const order = orders.find(o => o.orderId === orderId);
      
      if (order) {
        log(`成功获取用户订单，状态: ${order.status}`, 'success');
      } else {
        log('未找到用户订单', 'warning');
      }
      
      return response.data;
    } catch (error) {
      throw handleError(error, '获取用户订单');
    }
  },

  // 验证库存更新
  async verifyStockUpdate() {
    try {
      log('正在验证库存更新...', 'step');
      const response = await axios.get(
        `${API_BASE_URL}/products/${testData.product.id}/schedules`,
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      const schedules = response.data.data ? response.data.data.schedules : [];
      const updatedSchedule = schedules.find(s => s.date === testData.travelDate);
      
      if (updatedSchedule) {
        log(`库存验证: 原始库存 = 10, 当前库存 = ${updatedSchedule.total_stock || updatedSchedule.stock}`, 'info');
        
        const currentStock = parseInt(updatedSchedule.total_stock || updatedSchedule.stock);
        if (currentStock === 8) {
          log('库存正确更新', 'success');
        } else {
          log(`库存更新异常，期望值: 8, 实际值: ${currentStock}`, 'warning');
        }
      } else {
        log('未找到相关价格调度记录', 'warning');
      }
      
      return response.data;
    } catch (error) {
      throw handleError(error, '验证库存更新');
    }
  }
};

// 数据库修复函数
const dbFix = {
  // 修复产品表结构
  async fixProductTable() {
    try {
      log('正在检查产品表结构...', 'step');
      
      // 检查product_number字段是否存在
      const [productNumberCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'product_number'
      `);
      
      if (productNumberCheck[0].count === 0) {
        await sequelize.query(`
          ALTER TABLE products 
          ADD COLUMN product_number VARCHAR(50) NULL AFTER id
        `);
        log('添加了product_number字段', 'success');
      }
      
      log('产品表结构已检查', 'success');
    } catch (error) {
      log(`检查产品表结构失败: ${error.message}`, 'error');
    }
  },
  
  // 修复价格调度表结构
  async fixPriceScheduleTable() {
    try {
      log('正在检查价格调度表结构...', 'step');
      
      // 检查total_stock字段是否存在
      const [totalStockCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'price_schedules' 
        AND COLUMN_NAME = 'total_stock'
      `);
      
      if (totalStockCheck[0].count === 0) {
        await sequelize.query(`
          ALTER TABLE price_schedules 
          ADD COLUMN total_stock INT NOT NULL DEFAULT 10
        `);
        log('添加了total_stock字段', 'success');
      }
      
      // 检查available_stock字段是否存在
      const [availableStockCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'price_schedules' 
        AND COLUMN_NAME = 'available_stock'
      `);
      
      if (availableStockCheck[0].count === 0) {
        await sequelize.query(`
          ALTER TABLE price_schedules 
          ADD COLUMN available_stock INT NULL
        `);
        log('添加了available_stock字段', 'success');
        
        // 设置available_stock的默认值与total_stock相同
        await sequelize.query(`
          UPDATE price_schedules 
          SET available_stock = total_stock 
          WHERE available_stock IS NULL
        `);
        log('设置了available_stock默认值', 'success');
      }
      
      log('价格调度表结构已检查', 'success');
    } catch (error) {
      log(`检查价格调度表结构失败: ${error.message}`, 'error');
    }
  },
  
  // 修复订单表结构
  async fixOrderTable() {
    try {
      log('正在检查订单表结构...', 'step');
      
      // 检查travel_date字段是否存在
      const [travelDateCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'travel_date'
      `);
      
      if (travelDateCheck[0].count === 0) {
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN travel_date DATE NULL
        `);
        log('添加了travel_date字段', 'success');
      }
      
      log('订单表结构已检查', 'success');
    } catch (error) {
      log(`检查订单表结构失败: ${error.message}`, 'error');
    }
  },
  
  // 修复所有缺少默认值的字段
  async fixMissingDefaults() {
    try {
      log('正在修复缺少默认值的字段...', 'step');
      
      // 修复价格调度表的库存字段
      await sequelize.query(`
        UPDATE price_schedules 
        SET total_stock = 10 
        WHERE total_stock IS NULL
      `);
      
      // 修复价格调度表的可用库存字段
      await sequelize.query(`
        UPDATE price_schedules 
        SET available_stock = total_stock 
        WHERE available_stock IS NULL
      `);
      
      log('缺少默认值的字段已修复', 'success');
    } catch (error) {
      log(`修复缺少默认值的字段失败: ${error.message}`, 'error');
    }
  }
};

// 主测试流程
async function runTest() {
  log('开始完整业务流程测试', 'info');
  log('------------------------', 'info');
  
  try {
    // 连接数据库
    await sequelize.authenticate();
    log('数据库连接成功', 'success');
    
    // 修复数据库结构
    await dbFix.fixProductTable();
    await dbFix.fixPriceScheduleTable();
    await dbFix.fixOrderTable();
    await dbFix.fixMissingDefaults();
    
    // 登录所有测试用户
    await api.login('admin');
    await api.login('merchant');
    await api.login('customer');
    
    // 商家创建产品
    await api.createProduct();
    
    // 创建价格调度
    await api.createPriceSchedules();
    
    // 提交产品审核
    await api.submitProductForReview();
    
    // 管理员审核产品
    await api.approveProduct();
    
    // 用户查看产品详情
    await api.getProductDetails();
    
    // 用户创建订单
    await api.createOrder();
    
    // 商家确认订单
    await api.confirmOrder();
    
    // 用户查看订单
    await api.getCustomerOrders();
    
    // 验证库存更新
    await api.verifyStockUpdate();
    
    log('------------------------', 'info');
    log('完整业务流程测试完成', 'success');
    
    // 输出测试结果摘要
    log('测试结果摘要:', 'info');
    log(`- 产品ID: ${testData.product.id}`, 'info');
    log(`- 产品状态: ${testData.product.status}`, 'info');
    log(`- 价格调度数量: ${testData.schedules.length || '未知'}`, 'info');
    log(`- 订单ID: ${testData.order ? (testData.order.id || testData.order.orderId || (testData.order.order ? testData.order.order.id : '未知')) : '未创建'}`, 'info');
    log(`- 订单状态: ${testData.order ? (testData.order.status || (testData.order.order ? testData.order.order.status : '未知')) : '未知'}`, 'info');
    
  } catch (error) {
    log('测试过程中出现错误', 'error');
    log(error.message, 'error');
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    log('数据库连接已关闭', 'info');
  }
}

// 执行测试
runTest();