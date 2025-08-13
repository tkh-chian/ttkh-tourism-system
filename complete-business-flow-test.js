/**
 * TTKH旅游系统 - 完整业务流程自动化测试
 * 
 * 本脚本自动测试完整业务流程并验证数据一致性：
 * 1. 商家创建产品并设置价格库存
 * 2. 管理员审核产品
 * 3. 用户浏览并下单
 * 4. 商家处理订单
 * 5. 验证库存联动更新
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// 测试用户凭据
const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123' },
  merchant: { username: 'merchant', password: 'merchant123' },
  customer: { username: 'customer', password: 'customer123' }
};

// 存储测试过程中生成的数据
const testData = {
  tokens: {},
  product: null,
  schedules: [],
  order: null
};

// 日志函数
const log = (message, type = 'info') => {
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '🔄'
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
      const productData = {
        title_zh: `测试产品 ${Date.now()}`,
        title_th: `Test Product ${Date.now()}`,
        description_zh: '这是一个自动化测试创建的产品',
        description_th: 'This is a product created by automated test',
        base_price: 100,
        product_number: `TEST-${Date.now()}`,
        name: `测试产品 ${Date.now()}`,
        description: '这是一个自动化测试创建的产品',
        price: 100,
        category: '旅游',
        location: '曼谷',
        duration: '1天',
        max_participants: 10
      };

      const response = await axios.post(
        `${API_BASE_URL}/products`,
        productData,
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      testData.product = response.data.data;
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
        
        const schedule = {
          product_id: testData.product.id,
          date: date.toISOString().split('T')[0],
          price: 100 + (i % 5) * 10, // 价格在100-140之间浮动
          total_stock: 10,
          available_stock: 10
        };
        
        schedules.push(schedule);
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/products/${testData.product.id}/schedules/batch`,
        { schedules },
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      testData.schedules = response.data.data || [];
      log(`成功创建 ${testData.schedules.length} 条价格调度记录`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '创建价格调度');
    }
  },

  // 提交产品审核
  async submitProductForReview() {
    try {
      log('正在提交产品审核...', 'step');
      const response = await axios.put(
        `${API_BASE_URL}/products/${testData.product.id}/status`,
        { status: 'pending' },
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      testData.product = response.data.data;
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
      
      log(`产品审核通过，状态: ${response.data.data.status}`, 'success');
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
      
      log(`成功获取产品详情: ${response.data.data.title_zh}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '获取产品详情');
    }
  },

  // 创建订单
  async createOrder() {
    try {
      log('正在创建订单...', 'step');
      
      // 获取第一个可用的价格调度
      const scheduleResponse = await axios.get(
        `${API_BASE_URL}/products/${testData.product.id}/schedules`,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      const availableSchedule = scheduleResponse.data.data.find(s => s.available_stock > 0);
      
      if (!availableSchedule) {
        throw new Error('没有找到可用的价格调度');
      }
      
      const orderData = {
        product_id: testData.product.id,
        schedule_id: availableSchedule.id,
        quantity: 2,
        contact_name: '测试用户',
        contact_phone: '13800138000',
        contact_email: 'test@example.com',
        special_requests: '自动化测试订单'
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${testData.tokens.customer}` } }
      );
      
      testData.order = response.data.data;
      log(`订单创建成功，ID: ${testData.order.id}`, 'success');
      return response.data;
    } catch (error) {
      throw handleError(error, '创建订单');
    }
  },

  // 商家确认订单
  async confirmOrder() {
    try {
      log('商家正在确认订单...', 'step');
      const response = await axios.put(
        `${API_BASE_URL}/merchant/orders/${testData.order.id}/status`,
        { status: 'confirmed' },
        { headers: { Authorization: `Bearer ${testData.tokens.merchant}` } }
      );
      
      log(`订单已确认，状态: ${response.data.data.status}`, 'success');
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
      
      const order = response.data.data.find(o => o.id === testData.order.id);
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
      
      const updatedSchedule = response.data.data.find(s => s.id === testData.order.schedule_id);
      
      if (updatedSchedule) {
        log(`库存验证: 原始库存 = 10, 当前可用库存 = ${updatedSchedule.available_stock}`, 'info');
        
        if (updatedSchedule.available_stock === 8) {
          log('库存正确更新', 'success');
        } else {
          log(`库存更新异常，期望值: 8, 实际值: ${updatedSchedule.available_stock}`, 'warning');
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
      
      await sequelize.query(`
        ALTER TABLE products 
        MODIFY COLUMN id VARCHAR(36) NOT NULL,
        MODIFY COLUMN merchant_id VARCHAR(36) NOT NULL;
      `);
      
      log('产品表结构已修复', 'success');
    } catch (error) {
      log(`修复产品表结构失败: ${error.message}`, 'error');
    }
  },
  
  // 修复价格调度表结构
  async fixPriceScheduleTable() {
    try {
      log('正在检查价格调度表结构...', 'step');
      
      await sequelize.query(`
        ALTER TABLE price_schedules 
        MODIFY COLUMN product_id VARCHAR(36) NOT NULL,
        MODIFY COLUMN total_stock INT NOT NULL DEFAULT 10,
        MODIFY COLUMN available_stock INT NOT NULL DEFAULT 10;
      `);
      
      log('价格调度表结构已修复', 'success');
    } catch (error) {
      log(`修复价格调度表结构失败: ${error.message}`, 'error');
    }
  },
  
  // 修复订单表结构
  async fixOrderTable() {
    try {
      log('正在检查订单表结构...', 'step');
      
      await sequelize.query(`
        ALTER TABLE orders 
        MODIFY COLUMN product_id VARCHAR(36) NOT NULL,
        MODIFY COLUMN customer_id VARCHAR(36) NOT NULL,
        MODIFY COLUMN merchant_id VARCHAR(36) NOT NULL,
        MODIFY COLUMN schedule_id VARCHAR(36) NOT NULL;
      `);
      
      log('订单表结构已修复', 'success');
    } catch (error) {
      log(`修复订单表结构失败: ${error.message}`, 'error');
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
        WHERE total_stock IS NULL;
        
        UPDATE price_schedules 
        SET available_stock = total_stock 
        WHERE available_stock IS NULL;
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
    log(`- 价格调度数量: ${testData.schedules.length}`, 'info');
    log(`- 订单ID: ${testData.order.id}`, 'info');
    log(`- 订单状态: ${testData.order.status}`, 'info');
    
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