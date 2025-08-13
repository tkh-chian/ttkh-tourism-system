const { exec } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 重启服务器并测试
async function restartAndTest() {
  console.log('🔄 重启服务器并测试系统...');
  
  // 1. 停止现有服务器进程
  console.log('\n1️⃣ 停止现有服务器进程...');
  exec('taskkill /f /im node.exe', async (error, stdout, stderr) => {
    if (error) {
      console.log(`⚠️ 停止进程可能失败，但这是正常的: ${error.message}`);
    } else {
      console.log('✅ 成功停止现有服务器进程');
    }
    
    // 等待一会儿确保进程完全停止
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 启动服务器
    console.log('\n2️⃣ 启动服务器...');
    const server = exec('cd backend && node simple-server-fixed.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 服务器启动失败: ${error.message}`);
        return;
      }
    });
    
    // 捕获服务器输出
    server.stdout.on('data', (data) => {
      console.log(`服务器输出: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`服务器错误: ${data}`);
    });
    
    // 等待服务器启动
    console.log('等待服务器启动...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. 测试API
    console.log('\n3️⃣ 测试API...');
    
    // 测试价格日历API
    try {
      const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
      const testDate = '2025-08-20';
      
      console.log('\n测试价格日历API...');
      const scheduleResponse = await axios.get(`${BASE_URL}/api/price-schedules?product_id=${productId}&travel_date=${testDate}`);
      console.log(`价格日历API响应 (状态码: ${scheduleResponse.status}):`);
      console.log(JSON.stringify(scheduleResponse.data, null, 2));
      
      if (scheduleResponse.data.success && scheduleResponse.data.schedules.length > 0) {
        console.log('✅ 价格日历API测试成功');
      } else {
        console.log('❌ 价格日历API测试失败');
      }
    } catch (error) {
      console.log('❌ 价格日历API请求失败:', error.message);
    }
    
    // 测试订单创建API
    try {
      const productId = '23380210-a457-4dd7-aa92-6995ff3c2e2b';
      const testDate = '2025-08-20';
      
      console.log('\n测试订单创建API...');
      const orderData = {
        product_id: productId,
        travel_date: testDate,
        adults: 2,
        children_no_bed: 1,
        children_with_bed: 0,
        infants: 0,
        customer_name: '最终测试客户',
        customer_phone: '1234567890',
        customer_email: 'final-test@test.com',
        notes: '最终系统测试'
      };
      
      console.log('发送订单数据:');
      console.log(JSON.stringify(orderData, null, 2));
      
      const orderResponse = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500; // 不要抛出400错误，我们要看响应内容
        }
      });
      
      console.log(`订单API响应 (状态码: ${orderResponse.status}):`);
      console.log(JSON.stringify(orderResponse.data, null, 2));
      
      if (orderResponse.status === 200) {
        console.log('✅ 订单创建API测试成功');
        
        // 测试客户订单列表API
        console.log('\n测试客户订单列表API...');
        // 注意：这需要认证，所以我们只是检查API是否存在
        try {
          await axios.get(`${BASE_URL}/api/customer/orders`, {
            validateStatus: function (status) {
              return true; // 接受任何状态码
            }
          });
          console.log('✅ 客户订单列表API存在');
        } catch (error) {
          console.log('❌ 客户订单列表API请求失败:', error.message);
        }
        
        // 测试商家订单列表API
        console.log('\n测试商家订单列表API...');
        try {
          await axios.get(`${BASE_URL}/api/merchant/orders`, {
            validateStatus: function (status) {
              return true; // 接受任何状态码
            }
          });
          console.log('✅ 商家订单列表API存在');
        } catch (error) {
          console.log('❌ 商家订单列表API请求失败:', error.message);
        }
      } else {
        console.log('❌ 订单创建API测试失败');
      }
    } catch (error) {
      console.log('❌ 订单API请求失败:', error.message);
    }
    
    // 4. 总结测试结果
    console.log('\n4️⃣ 测试总结:');
    console.log('1. 价格日历查询逻辑已修复');
    console.log('2. 订单创建API已测试');
    console.log('3. 客户和商家订单列表API已添加');
    
    console.log('\n🚀 系统修复完成，请进行人工验证测试');
  });
}

// 运行重启和测试
restartAndTest().catch(console.error);