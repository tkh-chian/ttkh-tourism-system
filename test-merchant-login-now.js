const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testMerchantLoginNow() {
  console.log('🏪 测试商家登录...\n');
  
  try {
    // 1. 先确保商家账号存在
    console.log('=== 1. 确保商家账号存在 ===');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'testmerchant',
        email: 'testmerchant@test.com',
        password: 'merchant123',
        role: 'merchant',
        company_name: '测试旅游公司',
        contact_person: '张经理'
      });
      console.log('✅ 商家账号创建成功');
    } catch (error) {
      if (error.response?.data?.message?.includes('已存在')) {
        console.log('ℹ️  商家账号已存在');
      } else {
        console.log('⚠️  账号创建问题:', error.response?.data?.message);
      }
    }
    
    // 2. 测试商家登录
    console.log('\n=== 2. 测试商家登录 ===');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testmerchant@test.com',
      password: 'merchant123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      
      console.log('✅ 商家登录成功!');
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   公司: ${user.company_name || '未设置'}`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      
      // 3. 测试商家权限
      console.log('\n=== 3. 测试商家权限 ===');
      try {
        const productsResponse = await axios.get(`${API_BASE}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 商家可以访问产品列表');
        
        // 4. 测试创建产品
        console.log('\n=== 4. 测试创建产品 ===');
        const productData = {
          name: '测试产品-商家登录验证',
          description: '这是验证商家登录功能的测试产品',
          price: 1200,
          category: '一日游',
          location: '曼谷',
          duration: '6小时',
          maxParticipants: 15
        };
        
        const createResponse = await axios.post(`${API_BASE}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (createResponse.data.success) {
          const product = createResponse.data.product;
          console.log('✅ 产品创建成功!');
          console.log(`   产品ID: ${product.id}`);
          console.log(`   产品编号: ${product.product_number || '系统生成'}`);
          console.log(`   产品名称: ${product.name}`);
          console.log(`   状态: ${product.status}`);
        }
        
      } catch (error) {
        console.log('❌ 商家权限测试失败:', error.response?.data?.message);
      }
      
      console.log('\n🎉 商家登录测试完成!');
      console.log('\n📋 现在您可以：');
      console.log('1. 访问 http://localhost:3000/login');
      console.log('2. 使用邮箱: testmerchant@test.com');
      console.log('3. 使用密码: merchant123');
      console.log('4. 登录后进入商家仪表板');
      console.log('5. 开始创建和管理产品');
      
    }
    
  } catch (error) {
    console.log('❌ 商家登录失败:', error.response?.data?.message || error.message);
    
    console.log('\n🔧 解决方案:');
    console.log('1. 确认后端服务运行: http://localhost:3001');
    console.log('2. 确认前端服务运行: http://localhost:3000');
    console.log('3. 清除浏览器缓存');
    console.log('4. 使用无痕模式访问');
  }
}

testMerchantLoginNow();