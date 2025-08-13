const mysql = require('mysql2/promise');
const axios = require('axios');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

const API_BASE = 'http://localhost:3001';

async function finalTest() {
  console.log('🚀 开始最终验证测试...\n');
  
  let adminToken = null;
  let merchantId = null;
  let merchantEmail = `merchant_${Date.now()}@test.com`;
  let merchantToken = null;
  let productId = null;
  
  try {
    // 1. 管理员登录
    console.log('👨‍💼 测试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      adminToken = loginResponse.data.data.token;
      console.log('✅ 管理员登录成功');
    } else {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    // 2. 测试获取商家API
    console.log('\n📋 测试获取商家API...');
    const merchantsResponse = await axios.get(`${API_BASE}/api/admin/merchants`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('API响应结构:', {
      success: merchantsResponse.data.success,
      hasData: !!merchantsResponse.data.data,
      dataType: typeof merchantsResponse.data.data,
      isArray: Array.isArray(merchantsResponse.data.data),
      dataLength: merchantsResponse.data.data ? merchantsResponse.data.data.length : 0
    });
    
    if (merchantsResponse.data.success && Array.isArray(merchantsResponse.data.data)) {
      console.log('✅ 获取商家API修复成功');
      const pendingMerchants = merchantsResponse.data.data.filter(m => m.status === 'pending');
      console.log(`找到 ${pendingMerchants.length} 个待审核商家`);
    } else {
      console.log('❌ 获取商家API仍有问题');
      return;
    }
    
    // 3. 测试商家注册
    console.log('\n🏪 测试商家注册...');
    const testMerchant = {
      username: `测试商家_${Date.now()}`,
      email: merchantEmail,
      password: 'merchant123',
      role: 'merchant',
      company_name: '测试旅游公司',
      contact_person: '张三'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testMerchant);
    
    console.log('注册响应结构:', {
      success: registerResponse.data.success,
      hasData: !!registerResponse.data.data,
      hasUser: !!(registerResponse.data.data && registerResponse.data.data.user),
      userId: registerResponse.data.data && registerResponse.data.data.user ? registerResponse.data.data.user.id : null
    });
    
    if (registerResponse.data.success && registerResponse.data.data && registerResponse.data.data.user && registerResponse.data.data.user.id) {
      console.log('✅ 商家注册API修复成功');
      merchantId = registerResponse.data.data.user.id;
      console.log(`新商家ID: ${merchantId}`);
      
      // 4. 测试商家审核
      console.log('\n✅ 测试商家审核...');
      const approveResponse = await axios.put(`${API_BASE}/api/admin/merchants/${merchantId}/approve`, {
        status: 'approved'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (approveResponse.data.success) {
        console.log('✅ 商家审核功能正常');
        
        // 5. 测试商家登录
        console.log('\n🏪 测试商家登录...');
        const merchantLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
          email: merchantEmail,
          password: 'merchant123'
        });
        
        if (merchantLoginResponse.data.success && merchantLoginResponse.data.data && merchantLoginResponse.data.data.token) {
          merchantToken = merchantLoginResponse.data.data.token;
          console.log('✅ 商家登录成功');
          
          // 6. 测试商家创建产品
          console.log('\n📦 测试商家创建产品...');
          const testProduct = {
            title_zh: `测试产品_${Date.now()}`,
            title_th: 'ผลิตภัณฑ์ทดสอบ',
            description_zh: '这是一个测试产品',
            base_price: 1500.00,
            poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
            poster_filename: 'test-poster.jpg'
          };
          
          const createProductResponse = await axios.post(`${API_BASE}/api/products`, testProduct, {
            headers: { 'Authorization': `Bearer ${merchantToken}` }
          });
          
          if (createProductResponse.data.success || createProductResponse.data.id) {
            console.log('✅ 商家创建产品成功');
            productId = createProductResponse.data.id;
            console.log(`新产品ID: ${productId}`);
            
            // 7. 测试管理员审核产品
            console.log('\n📋 测试管理员审核产品...');
            const approveProductResponse = await axios.put(`${API_BASE}/api/admin/products/${productId}/approve`, {
              status: 'approved'
            }, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (approveProductResponse.data.success) {
              console.log('✅ 产品审核功能正常');
            } else {
              console.log('❌ 产品审核功能有问题');
            }
          } else {
            console.log('❌ 商家创建产品失败');
          }
        } else {
          console.log('❌ 商家登录失败');
        }
      } else {
        console.log('❌ 商家审核功能有问题');
      }
    } else {
      console.log('❌ 商家注册API仍有问题');
    }
    
    console.log('\n🎉 最终验证测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

finalTest().catch(console.error);