const axios = require('axios');

async function testPriceCalendar() {
  try {
    // 先登录获取token
    console.log('🔐 正在登录商家账户...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'merchant',
      password: 'merchant123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 商家登录成功');
    
    // 获取商家的产品列表
    console.log('📋 获取产品列表...');
    const productsResponse = await axios.get('http://localhost:3002/api/products/merchant/my-products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const products = productsResponse.data.data.products;
    console.log(`找到 ${products.length} 个产品`);
    
    if (products.length === 0) {
      console.log('❌ 没有产品，无法测试价格日历');
      return;
    }
    
    const productId = products[0].id;
    console.log(`📦 使用产品ID: ${productId} (${products[0].title_zh})`);
    
    // 测试1: 设置价格日历
    console.log('\n📅 测试1: 设置价格日历...');
    const schedules = [
      {
        date: '2025-01-15',
        price: 1200,
        stock: 10
      },
      {
        date: '2025-01-16',
        price: 1300,
        stock: 8
      },
      {
        date: '2025-01-17',
        price: 1100,
        stock: 15
      }
    ];
    
    const setBatchResponse = await axios.post(`http://localhost:3002/api/products/${productId}/schedules/batch`, {
      schedules
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 批量设置价格日历成功:', setBatchResponse.data.message);
    
    // 测试2: 获取价格日历
    console.log('\n📅 测试2: 获取价格日历...');
    const getSchedulesResponse = await axios.get(`http://localhost:3002/api/products/${productId}/schedules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (getSchedulesResponse.data.success) {
      const schedules = getSchedulesResponse.data.data.schedules;
      console.log(`✅ 获取价格日历成功，共 ${schedules.length} 条记录:`);
      schedules.forEach(schedule => {
        console.log(`  - ${schedule.travel_date}: ¥${schedule.price}, 库存${schedule.available_stock}`);
      });
    }
    
    // 测试3: 删除单个日期的价格设置
    console.log('\n📅 测试3: 删除单个日期的价格设置...');
    const deleteResponse = await axios.delete(`http://localhost:3002/api/products/${productId}/schedules/2025-01-16`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 删除单个价格设置成功:', deleteResponse.data.message);
    
    // 测试4: 再次获取价格日历验证删除
    console.log('\n📅 测试4: 验证删除结果...');
    const verifyResponse = await axios.get(`http://localhost:3002/api/products/${productId}/schedules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (verifyResponse.data.success) {
      const schedules = verifyResponse.data.data.schedules;
      console.log(`✅ 验证成功，现在共 ${schedules.length} 条记录:`);
      schedules.forEach(schedule => {
        console.log(`  - ${schedule.travel_date}: ¥${schedule.price}, 库存${schedule.available_stock}`);
      });
    }
    
    console.log('\n🎉 价格日历功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPriceCalendar();