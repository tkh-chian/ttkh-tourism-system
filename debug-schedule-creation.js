const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function debugScheduleCreation() {
  try {
    console.log('🔍 调试价格日历创建...');

    // 1. 管理员登录
    console.log('1. 管理员登录...');
    const adminRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    const adminToken = adminRes.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 商家登录
    console.log('2. 商家登录...');
    const merchantRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'merchant@ttkh.com',
      password: 'merchant123'
    });
    const merchantToken = merchantRes.data.data.token;
    console.log('✅ 商家登录成功');

    // 3. 创建产品
    console.log('3. 创建产品...');
    const dummyPoster = `data:image/png;base64,${Buffer.from('poster').toString('base64')}`;
    const dummyPdf = `data:application/pdf;base64,${Buffer.from('pdf-content').toString('base64')}`;
    
    const productRes = await axios.post(`${BACKEND_URL}/api/products`, {
      title_zh: '调试测试产品',
      title_th: 'ทดสอบสินค้าดีบัก',
      description_zh: '调试描述',
      description_th: 'คำอธิบายดีบัก',
      base_price: 100,
      poster_image: dummyPoster,
      poster_filename: 'debug-poster.png',
      pdf_file: dummyPdf,
      pdf_filename: 'debug-info.pdf'
    }, { 
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    
    const productId = productRes.data.data.productId;
    console.log('✅ 产品创建成功，ID:', productId);

    // 4. 设置价格日历
    console.log('4. 设置价格日历...');
    const scheduleRes = await axios.post(`${BACKEND_URL}/api/products/${productId}/schedules/batch`, {
      schedules: [
        { date: '2025-12-01', price: 120, stock: 5 },
        { date: '2025-12-02', price: 130, stock: 3 }
      ]
    }, { 
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    
    console.log('✅ 价格日历设置成功');
    console.log('📊 响应:', scheduleRes.data);

  } catch (error) {
    console.error('❌ 调试失败:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('📋 详细错误:', error.response.data.error);
    }
  }
}

debugScheduleCreation();