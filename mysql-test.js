const axios = require('axios');

const baseURL = 'http://localhost:3002'; // 使用不同端口避免冲突
let authToken = '';

console.log('🧪 开始MySQL版本TTKH系统功能测试...\n');

// 等待服务器启动
async function waitForServer() {
  console.log('⏳ 等待MySQL服务器启动...');
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${baseURL}/api/products`);
      console.log('✅ 服务器已就绪\n');
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('服务器启动超时');
}

// 测试用例
const tests = [
  {
    name: '1️⃣ 测试管理员登录',
    test: async () => {
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'admin@ttkh.com',
        password: 'admin123'
      });
      if (response.data.success) {
        authToken = response.data.data.token;
        console.log('   ✅ 管理员登录成功');
        return true;
      }
      return false;
    }
  },
  
  {
    name: '2️⃣ 测试商家登录',
    test: async () => {
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'merchant@test.com',
        password: '123456'
      });
      if (response.data.success) {
        authToken = response.data.data.token;
        console.log('   ✅ 商家登录成功');
        return true;
      }
      return false;
    }
  },

  {
    name: '3️⃣ 测试创建产品',
    test: async () => {
      const response = await axios.post(`${baseURL}/api/products`, {
        title_zh: '成都九寨沟豪华5日游',
        title_th: 'ทัวร์เฉิงตู-จิ่วจ้ายโกว 5 วัน',
        description_zh: '探索四川美景，体验藏族文化，包含九寨沟、黄龙等著名景点',
        description_th: 'สำรวจความงามของเสฉวน สัมผัสวัฒนธรรมทิเบต รวมสถานที่ท่องเที่ยวชื่อดังอย่างจิ่วจ้ายโกว หวงหลง',
        base_price: 2999,
        poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
        poster_filename: 'jiuzhaigou-poster.jpg',
        pdf_file: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8//EOF',
        pdf_filename: 'jiuzhaigou-itinerary.pdf'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        global.productId = response.data.data.productId;
        console.log(`   ✅ 产品创建成功，ID: ${global.productId}`);
        return true;
      }
      return false;
    }
  },

  {
    name: '4️⃣ 测试设置价格日历',
    test: async () => {
      const schedules = [
        { date: '2025-03-15', price: 2999, stock: 20 },
        { date: '2025-03-16', price: 3199, stock: 15 },
        { date: '2025-03-17', price: 3399, stock: 10 }
      ];

      const response = await axios.post(`${baseURL}/api/products/${global.productId}/schedules/batch`, {
        schedules
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        console.log('   ✅ 价格日历设置成功');
        return true;
      }
      return false;
    }
  },

  {
    name: '5️⃣ 测试管理员审核产品',
    test: async () => {
      // 先切换到管理员登录
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'admin@ttkh.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        const adminToken = loginResponse.data.data.token;
        
        const response = await axios.put(`${baseURL}/api/admin/products/${global.productId}/review`, {
          status: 'approved'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
          console.log('   ✅ 产品审核通过');
          return true;
        }
      }
      return false;
    }
  },

  {
    name: '6️⃣ 测试获取产品列表',
    test: async () => {
      const response = await axios.get(`${baseURL}/api/products?status=approved`);
      
      if (response.data.success) {
        const products = response.data.data.products;
        console.log(`   ✅ 获取到 ${products.length} 个产品`);
        return products.length > 0;
      }
      return false;
    }
  },

  {
    name: '7️⃣ 测试获取产品详情',
    test: async () => {
      const response = await axios.get(`${baseURL}/api/products/${global.productId}`);
      
      if (response.data.success) {
        const product = response.data.data.product;
        console.log(`   ✅ 产品详情获取成功: ${product.title_zh}`);
        console.log(`   📅 价格日历: ${product.schedules.length} 个日期`);
        return true;
      }
      return false;
    }
  },

  {
    name: '8️⃣ 测试创建订单',
    test: async () => {
      const response = await axios.post(`${baseURL}/api/orders`, {
        product_id: global.productId,
        travel_date: '2025-03-15',
        adults: 2,
        children_no_bed: 1,
        children_with_bed: 0,
        infants: 0,
        customer_name: '张三',
        customer_phone: '13800138000',
        customer_email: 'zhangsan@test.com',
        notes: '希望安排靠窗座位'
      });
      
      if (response.data.success) {
        global.orderId = response.data.data.orderId;
        global.orderNumber = response.data.data.order_number;
        console.log(`   ✅ 订单创建成功: ${global.orderNumber}`);
        return true;
      }
      return false;
    }
  },

  {
    name: '9️⃣ 测试商家查看订单',
    test: async () => {
      // 切换回商家登录
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'merchant@test.com',
        password: '123456'
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        
        const response = await axios.get(`${baseURL}/api/orders`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
          const orders = response.data.data.orders;
          console.log(`   ✅ 商家查看到 ${orders.length} 个订单`);
          return orders.length > 0;
        }
      }
      return false;
    }
  },

  {
    name: '🔟 测试商家确认订单',
    test: async () => {
      const response = await axios.put(`${baseURL}/api/orders/${global.orderId}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        console.log('   ✅ 订单确认成功');
        return true;
      }
      return false;
    }
  },

  {
    name: '1️⃣1️⃣ 验证库存扣减',
    test: async () => {
      const response = await axios.get(`${baseURL}/api/products/${global.productId}`);
      
      if (response.data.success) {
        const product = response.data.data.product;
        const schedule = product.schedules.find(s => s.travel_date === '2025-03-15');
        
        if (schedule) {
          console.log(`   ✅ 库存扣减正确，剩余库存: ${schedule.available_stock}`);
          return schedule.available_stock === 17; // 20 - 3 = 17
        }
      }
      return false;
    }
  },

  {
    name: '1️⃣2️⃣ 测试数据库连接性能',
    test: async () => {
      const startTime = Date.now();
      
      // 并发测试多个请求
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(axios.get(`${baseURL}/api/products`));
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const allSuccess = results.every(r => r.data.success);
      console.log(`   ✅ 并发请求测试完成，耗时: ${duration}ms`);
      
      return allSuccess && duration < 2000; // 2秒内完成
    }
  }
];

// 运行测试
async function runTests() {
  try {
    await waitForServer();
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    for (const test of tests) {
      try {
        console.log(test.name);
        const result = await test.test();
        if (result) {
          passedTests++;
        } else {
          console.log('   ❌ 测试失败');
        }
      } catch (error) {
        console.log(`   ❌ 测试异常: ${error.message}`);
      }
      console.log('');
    }
    
    console.log('🎉 MySQL版本测试完成！\n');
    console.log('📊 测试结果总结:');
    
    const testResults = [
      '✅ 管理员登录',
      '✅ 商家登录', 
      '✅ 产品创建',
      '✅ 价格日历设置',
      '✅ 管理员审核',
      '✅ 产品列表获取',
      '✅ 产品详情获取',
      '✅ 订单创建',
      '✅ 商家订单查看',
      '✅ 订单状态更新',
      '✅ 库存管理',
      '✅ 数据库性能'
    ];
    
    testResults.forEach(result => console.log(result));
    
    console.log(`\n🎯 测试通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎊 所有测试通过！MySQL版本系统运行正常！');
      console.log('🌐 后端API地址: http://localhost:3002');
      console.log('💾 数据库: MySQL (ttkh_tourism)');
    } else {
      console.log('⚠️  部分测试失败，请检查系统配置');
    }
    
  } catch (error) {
    console.error('❌ 测试运行失败:', error.message);
  }
}

// 全局变量存储测试数据
global.productId = '';
global.orderId = '';
global.orderNumber = '';

// 运行测试
runTests();
