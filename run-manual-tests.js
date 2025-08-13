const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';
const downloadsDir = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

let adminToken, merchantToken, productId, userToken;

/**
 * 执行单个步骤，并捕获错误，保证脚本不断续执行
 * @param {string} name 步骤名称
 * @param {Function} fn 异步操作函数
 */
async function step(name, fn) {
  console.log(`\n──── ${name} ────`);
  try {
    await fn();
    console.log(`✅ ${name} 成功`);
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error(`❌ ${name} 失败:`, msg);
  }
}

function saveBase64ToFile(base64, filename) {
  const data = base64.replace(/^data:.*;base64,/, '');
  fs.writeFileSync(path.join(downloadsDir, filename), Buffer.from(data, 'base64'));
  console.log(`  文件已保存: ${filename}`);
}

async function manualTest() {
  console.log('🎯 开始模拟人工测试流程');

  const timestamp = Date.now();
  const merchantEmail = `auto-merchant-${timestamp}@example.com`;
  const userEmail = `auto-user-${timestamp}@example.com`;

  await step('0. 管理员登录', async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@ttkh.com',
      password: 'admin123'
    });
    adminToken = res.data.data.token;
  });

  await step('1. 商家注册', async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      username: `自动商家${timestamp}`,
      email: merchantEmail,
      password: '123456',
      role: 'merchant'
    });
    // 注册成功后立即审核
    const merchantId = res.data.data.userId;
    await axios.put(`${BACKEND_URL}/api/admin/users/${merchantId}/review`, { status: 'approved' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  await step('2. 商家登录', async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: merchantEmail,
      password: '123456'
    });
    merchantToken = res.data.data.token;
  });

  await step('3. 创建产品 & 设置价格日历', async () => {
    const dummyPoster = `data:image/png;base64,${Buffer.from('poster').toString('base64')}`;
    const dummyPdf = `data:application/pdf;base64,${Buffer.from('pdf-content').toString('base64')}`;
    const res = await axios.post(`${BACKEND_URL}/api/products`, {
      title_zh: '测试产品',
      title_th: 'ทดสอบสินค้า',
      description_zh: '描述',
      description_th: 'คำอธิบาย',
      base_price: 100,
      poster_image: dummyPoster,
      poster_filename: 'poster.png',
      pdf_file: dummyPdf,
      pdf_filename: 'info.pdf'
    }, { headers: { Authorization: `Bearer ${merchantToken}` }});
    productId = res.data.data.productId;
    await axios.post(`${BACKEND_URL}/api/products/${productId}/schedules/batch`, {
      schedules: [
        { date: '2025-12-01', price: 120, stock: 5 },
        { date: '2025-12-02', price: 130, stock: 3 }
      ]
    }, { headers: { Authorization: `Bearer ${merchantToken}` }});
  });

  await step('4. 管理员审核产品', async () => {
    await axios.put(`${BACKEND_URL}/api/admin/products/${productId}/review`, { status: 'approved' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  await step('5. 下载海报 & PDF', async () => {
    const res = await axios.get(`${BACKEND_URL}/api/products/${productId}`);
    const { poster_image, pdf_file } = res.data.data.product;
    saveBase64ToFile(poster_image, 'poster.png');
    saveBase64ToFile(pdf_file, 'info.pdf');
  });

  await step('6. 用户注册', async () => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      username: `自动用户${timestamp}`,
      email: userEmail,
      password: '123456',
      role: 'customer'
    });
    const userId = res.data.data.userId;
    await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/review`, { status: 'approved' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  await step('7. 用户登录 & 下单', async () => {
    const resLogin = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: userEmail,
      password: '123456'
    });
    userToken = resLogin.data.data.token;
    const resOrder = await axios.post(`${BACKEND_URL}/api/orders`, {
      product_id: productId,
      travel_date: '2025-12-01',
      adults: 1,
      children_no_bed: 0,
      children_with_bed: 0,
      infants: 0,
      customer_name: '测试用户',
      customer_phone: '1234567890',
      customer_email: userEmail
    }, { headers: { Authorization: `Bearer ${userToken}` }});
    console.log(`  订单ID: ${resOrder.data.data.orderId}`);
  });

  await step('8. 商家审核订单', async () => {
    // 商家登录已完成，使用 merchantToken
    const orders = await axios.get(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    const lastOrder = orders.data.data.orders.pop();
    await axios.put(`${BACKEND_URL}/api/orders/${lastOrder.id}/status`, {
      status: 'approved'
    }, { headers: { Authorization: `Bearer ${merchantToken}` }});
  });

  console.log('\n🎉 所有流程执行完毕！');
}

manualTest();