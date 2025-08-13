const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

// API基础URL
const API_BASE = 'http://localhost:3001';

class RealE2ETest {
  constructor() {
    this.connection = null;
    this.testResults = [];
    this.adminToken = null;
    this.merchantToken = null;
    this.customerToken = null;
  }

  async init() {
    console.log('🚀 开始真实端对端测试...\n');
    this.connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  logResult(test, success, message, data = null) {
    const result = { test, success, message, data, timestamp: new Date() };
    this.testResults.push(result);
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    if (data) console.log('   数据:', JSON.stringify(data, null, 2));
  }

  // 1. 测试数据库连接和数据
  async testDatabase() {
    console.log('\n📊 测试数据库状态...');
    
    try {
      // 检查用户表
      const [users] = await this.connection.execute(
        'SELECT id, username, email, role, status FROM users WHERE role IN ("admin", "merchant", "customer") LIMIT 10'
      );
      this.logResult('数据库-用户表', true, `找到 ${users.length} 个用户`, users);

      // 检查产品表
      const [products] = await this.connection.execute(
        'SELECT id, product_number, title_zh, status, merchant_id FROM products LIMIT 5'
      );
      this.logResult('数据库-产品表', true, `找到 ${products.length} 个产品`, products);

      // 检查订单表
      const [orders] = await this.connection.execute(
        'SELECT id, order_number, status, customer_id FROM orders LIMIT 5'
      );
      this.logResult('数据库-订单表', true, `找到 ${orders.length} 个订单`, orders);

    } catch (error) {
      this.logResult('数据库连接', false, error.message);
    }
  }

  // 2. 测试后端API服务器
  async testBackendServer() {
    console.log('\n🔧 测试后端服务器...');
    
    try {
      const response = await axios.get(`${API_BASE}/api/health`);
      this.logResult('后端服务器', true, '服务器运行正常', response.data);
    } catch (error) {
      this.logResult('后端服务器', false, `服务器连接失败: ${error.message}`);
    }
  }

  // 3. 测试管理员登录
  async testAdminLogin() {
    console.log('\n👨‍💼 测试管理员登录...');
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'admin@ttkh.com',
        password: 'admin123'
      });
      
      if (response.data.token) {
        this.adminToken = response.data.token;
        this.logResult('管理员登录', true, '登录成功', { role: response.data.user.role });
      } else {
        this.logResult('管理员登录', false, '未返回token');
      }
    } catch (error) {
      this.logResult('管理员登录', false, error.response?.data?.message || error.message);
    }
  }

  // 4. 测试管理员获取待审核商家
  async testAdminGetPendingMerchants() {
    console.log('\n📋 测试管理员获取待审核商家...');
    
    if (!this.adminToken) {
      this.logResult('获取待审核商家', false, '缺少管理员token');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/admin/merchants`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      const pendingMerchants = response.data.filter(m => m.status === 'pending');
      this.logResult('获取待审核商家', true, `找到 ${pendingMerchants.length} 个待审核商家`, pendingMerchants);
      
      return pendingMerchants;
    } catch (error) {
      this.logResult('获取待审核商家', false, error.response?.data?.message || error.message);
    }
  }

  // 5. 测试商家注册
  async testMerchantRegistration() {
    console.log('\n🏪 测试商家注册...');
    
    const testMerchant = {
      username: `测试商家_${Date.now()}`,
      email: `merchant_${Date.now()}@test.com`,
      password: 'merchant123',
      role: 'merchant'
    };

    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, testMerchant);
      this.logResult('商家注册', true, '注册成功', { id: response.data.user.id });
      return response.data.user;
    } catch (error) {
      this.logResult('商家注册', false, error.response?.data?.message || error.message);
    }
  }

  // 6. 测试管理员审核商家
  async testMerchantApproval(merchantId) {
    console.log('\n✅ 测试管理员审核商家...');
    
    if (!this.adminToken || !merchantId) {
      this.logResult('商家审核', false, '缺少必要参数');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/api/admin/merchants/${merchantId}/approve`, {}, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      this.logResult('商家审核', true, '审核成功', response.data);
      return true;
    } catch (error) {
      this.logResult('商家审核', false, error.response?.data?.message || error.message);
    }
  }

  // 7. 测试商家登录
  async testMerchantLogin(email) {
    console.log('\n🏪 测试商家登录...');
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email,
        password: 'merchant123'
      });
      
      if (response.data.token) {
        this.merchantToken = response.data.token;
        this.logResult('商家登录', true, '登录成功', { role: response.data.user.role });
        return response.data.user;
      } else {
        this.logResult('商家登录', false, '未返回token');
      }
    } catch (error) {
      this.logResult('商家登录', false, error.response?.data?.message || error.message);
    }
  }

  // 8. 测试商家创建产品
  async testProductCreation() {
    console.log('\n📦 测试商家创建产品...');
    
    if (!this.merchantToken) {
      this.logResult('创建产品', false, '缺少商家token');
      return;
    }

    const testProduct = {
      title_zh: `测试产品_${Date.now()}`,
      title_th: 'ผลิตภัณฑ์ทดสอบ',
      description_zh: '这是一个测试产品',
      base_price: 1500.00,
      poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      poster_filename: 'test-poster.jpg'
    };

    try {
      const response = await axios.post(`${API_BASE}/api/products`, testProduct, {
        headers: { Authorization: `Bearer ${this.merchantToken}` }
      });
      
      this.logResult('创建产品', true, '产品创建成功', { 
        id: response.data.id, 
        product_number: response.data.product_number 
      });
      return response.data;
    } catch (error) {
      this.logResult('创建产品', false, error.response?.data?.message || error.message);
    }
  }

  // 9. 测试管理员审核产品
  async testProductApproval(productId) {
    console.log('\n✅ 测试管理员审核产品...');
    
    if (!this.adminToken || !productId) {
      this.logResult('产品审核', false, '缺少必要参数');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/api/admin/products/${productId}/approve`, {}, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      this.logResult('产品审核', true, '产品审核成功', response.data);
      return true;
    } catch (error) {
      this.logResult('产品审核', false, error.response?.data?.message || error.message);
    }
  }

  // 10. 测试客户注册和下单
  async testCustomerOrderFlow(productId) {
    console.log('\n👤 测试客户注册和下单流程...');
    
    // 注册客户
    const testCustomer = {
      username: `测试客户_${Date.now()}`,
      email: `customer_${Date.now()}@test.com`,
      password: 'customer123',
      role: 'customer'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testCustomer);
      this.logResult('客户注册', true, '注册成功', { id: registerResponse.data.user.id });

      // 客户登录
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testCustomer.email,
        password: testCustomer.password
      });
      
      this.customerToken = loginResponse.data.token;
      this.logResult('客户登录', true, '登录成功');

      // 创建订单
      if (productId) {
        const orderData = {
          product_id: productId,
          travel_date: '2025-09-15',
          adult_count: 2,
          child_count: 1,
          total_amount: 4500.00,
          customer_notes: '测试订单备注'
        };

        const orderResponse = await axios.post(`${API_BASE}/api/orders`, orderData, {
          headers: { Authorization: `Bearer ${this.customerToken}` }
        });
        
        this.logResult('创建订单', true, '订单创建成功', { 
          order_number: orderResponse.data.order_number 
        });
        return orderResponse.data;
      }
    } catch (error) {
      this.logResult('客户订单流程', false, error.response?.data?.message || error.message);
    }
  }

  // 运行完整测试
  async runCompleteTest() {
    try {
      await this.init();
      
      // 1. 数据库测试
      await this.testDatabase();
      
      // 2. 后端服务器测试
      await this.testBackendServer();
      
      // 3. 管理员登录测试
      await this.testAdminLogin();
      
      // 4. 获取待审核商家
      const pendingMerchants = await this.testAdminGetPendingMerchants();
      
      // 5. 商家注册测试
      const newMerchant = await this.testMerchantRegistration();
      
      // 6. 管理员审核商家
      if (newMerchant) {
        await this.testMerchantApproval(newMerchant.id);
        
        // 7. 商家登录测试
        const merchant = await this.testMerchantLogin(newMerchant.email);
        
        // 8. 商家创建产品
        const product = await this.testProductCreation();
        
        // 9. 管理员审核产品
        if (product) {
          await this.testProductApproval(product.id);
          
          // 10. 客户订单流程
          await this.testCustomerOrderFlow(product.id);
        }
      }
      
      // 输出测试结果
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      await this.cleanup();
    }
  }

  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 端对端测试结果汇总');
    console.log('='.repeat(60));
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);
    
    console.log(`总测试数: ${totalCount}`);
    console.log(`成功数: ${successCount}`);
    console.log(`失败数: ${totalCount - successCount}`);
    console.log(`成功率: ${successRate}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.message}`);
    });
    
    if (successRate >= 90) {
      console.log('\n🎉 端对端测试基本通过！系统运行良好。');
    } else if (successRate >= 70) {
      console.log('\n⚠️  端对端测试部分通过，需要修复一些问题。');
    } else {
      console.log('\n❌ 端对端测试失败较多，需要重点修复。');
    }
  }
}

// 运行测试
const test = new RealE2ETest();
test.runCompleteTest().catch(console.error);