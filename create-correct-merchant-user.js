const axios = require('axios');

async function createCorrectMerchantUser() {
  console.log('🏪 创建正确的商家测试用户...\n');
  
  try {
    // 创建商家用户
    const merchantData = {
      username: 'testmerchant',
      email: 'testmerchant@test.com',
      password: 'merchant123',
      role: 'merchant',
      company_name: '测试旅游公司',
      contact_person: '张经理'
    };
    
    console.log('创建商家用户:', merchantData.email);
    
    try {
      const registerResponse = await axios.post('http://localhost:3001/api/auth/register', merchantData);
      console.log('✅ 商家用户创建成功');
    } catch (error) {
      if (error.response?.data?.message?.includes('已存在')) {
        console.log('ℹ️  商家用户已存在');
      } else {
        console.log('⚠️  创建失败:', error.response?.data?.message);
      }
    }
    
    // 测试登录
    console.log('\n=== 测试商家登录 ===');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: merchantData.email,
      password: merchantData.password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 商家登录成功!');
      console.log('用户信息:', loginResponse.data.data.user);
      
      // 测试产品创建
      console.log('\n=== 测试产品创建 ===');
      const token = loginResponse.data.data.token;
      
      const productData = {
        title_zh: '普吉岛一日游',
        title_th: 'ทัวร์ภูเก็ตหนึ่งวัน',
        description_zh: '包含海滩游览、午餐、接送服务',
        description_th: 'รวมชมหาด อาหารกลางวัน บริการรับส่ง',
        base_price: 1500
      };
      
      const createResponse = await axios.post('http://localhost:3001/api/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (createResponse.data.success) {
        console.log('✅ 产品创建成功!');
        console.log('产品编号:', createResponse.data.data.product.product_number);
        console.log('产品ID:', createResponse.data.data.product.id);
      }
      
    }
    
    console.log('\n🎉 商家用户设置完成!');
    console.log('\n📋 登录信息:');
    console.log('邮箱: testmerchant@test.com');
    console.log('密码: merchant123');
    console.log('前端地址: http://localhost:3000/login');
    
  } catch (error) {
    console.log('❌ 错误:', error.response?.data?.message || error.message);
  }
}

createCorrectMerchantUser();