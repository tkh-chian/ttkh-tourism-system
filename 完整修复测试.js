const mysql = require('mysql2/promise');
const axios = require('axios');
const bcrypt = require('bcrypt');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

// API基础URL
const API_BASE = 'http://localhost:3001';

class CompleteE2ETest {
  constructor() {
    this.connection = null;
    this.testResults = [];
    this.adminToken = null;
    this.merchantToken = null;
    this.customerToken = null;
  }

  async init() {
    console.log('🚀 开始完整端对端测试...\n');
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
    if (data && typeof data === 'object') {
      console.log('   数据:', JSON.stringify(data, null, 2));
    }
  }

  // 1. 修复管理员密码
  async fixAdminPassword() {
    console.log('\n🔧 修复管理员密码...');
    
    try {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hashedPassword, 'admin@ttkh.com']
      );
      this.logResult('修复管理员密码', true, '管理员密码已重置');
    } catch (error) {
      this.logResult('修复管理员密码', false, error.message);
    }
  }

  // 2. 测试管理员登录
  async testAdminLogin() {
    console.log('\n👨‍💼 测试管理员登录...');
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'admin@ttkh.com',
        password: 'admin123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('登录响应:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.token) {
        this.adminToken = response.data.data.token;
        this.logResult('管理员登录', true, '登录成功', { 
          role: response.data.data.user.role,
          token: this.adminToken.substring(0, 20) + '...'
        });
        return true;
      } else {
        this.logResult('管理员登录', false, '响应格式错误', response.data);
        return false;
      }
    } catch (error) {
      this.logResult('管理员登录', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  // 3. 测试获取待审核商家
  async testGetPendingMerchants() {
    console.log('\n📋 测试获取待审核商家...');
    
    if (!this.adminToken) {
      this.logResult('获取待审核商家', false, '缺少管理员token');
      return [];
    }

    try {
      const response = await axios.get(`${API_BASE}/api/admin/merchants`, {
        headers: { 
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('商家API响应:', response.data);
      
      if (response.data.success) {
        const merchants = response.data.data || response.data;
        const pendingMerchants = merchants.filter(m => m.status === 'pending');
        this.logResult('获取待审核商家', true, `找到 ${pendingMerchants.length} 个待审核商家`, {
          total: merchants.length,
          pending: pendingMerchants.length,
          approved: merchants.filter(m => m.status === 'approved').length
        });
        return pendingMerchants;
      } else {
        this.logResult('获取待审核商家', false, '响应格式错误', response.data);
        return [];
      }
    } catch (error) {
      this.logResult('获取待审核商家', false, error.response?.data?.message || error.message);
      return [];
    }
  }

  // 4. 测试商家注册
  async testMerchantRegistration() {
    console.log('\n🏪 测试商家注册...');
    
    const testMerchant = {
      username: `测试商家_${Date.now()}`,
      email: `merchant_${Date.now()}@test.com`,
      password: 'merchant123',
      role: 'merchant',
      company_name: '测试旅游公司',
      contact_person: '张三'
    };

    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, testMerchant, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('注册响应:', response.data);
      
      if (response.data.success) {
        const user = response.data.data.user;
        this.logResult('商家注册', true, '注册成功', { 
          id: user.id, 
          email: user.email,
          status: user.status
        });
        return user;
      } else {
        this.logResult('商家注册', false, '注册失败', response.data);
        return null;
      }
    } catch (error) {
      this.logResult('商家注册', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  // 5. 测试管理员审核商家
  async testMerchantApproval(merchantId) {
    console.log('\n✅ 测试管理员审核商家...');
    
    if (!this.adminToken || !merchantId) {
      this.logResult('商家审核', false, '缺少必要参数');
      return false;
    }

    try {
      const response = await axios.put(`${API_BASE}/api/admin/merchants/${merchantId}/approve`, {}, {
        headers: { 
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('审核响应:', response.data);
      
      if (response.data.success) {
        this.logResult('商家审核', true, '审核成功', response.data.data);
        return true;
      } else {
        this.logResult('商家审核', false, '审核失败', response.data);
        return false;
      }
    } catch (error) {
      this.logResult('商家审核', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  // 6. 测试商家登录
  async testMerchantLogin(email) {
    console.log('\n🏪 测试商家登录...');
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email,
        password: 'merchant123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('商家登录响应:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.token) {
        this.merchantToken = response.data.data.token;
        this.logResult('商家登录', true, '登录成功', { 
          role: response.data.data.user.role,
          status: response.data.data.user.status
        });
        return response.data.data.user;
      } else {
        this.logResult('商家登录', false, '登录失败', response.data);
        return null;
      }
    } catch (error) {
      this.logResult('商家登录', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  // 7. 测试商家创建产品
  async testProductCreation() {
    console.log('\n📦 测试商家创建产品...');
    
    if (!this.merchantToken) {
      this.logResult('创建产品', false, '缺少商家token');
      return null;
    }

    const testProduct = {
      title_zh: `测试产品_${Date.now()}`,
      title_th: 'ผลิตภัณฑ์ทดสอบ',
      description_zh: '这是一个测试产品，包含完整的旅游行程安排',
      description_th: 'นี่คือผลิตภัณฑ์ทดสอบ',
      base_price: 1500.00,
      poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      poster_filename: 'test-poster.jpg',
      pdf_file: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8w6HCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMOgw7bCuMO