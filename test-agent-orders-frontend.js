const axios = require('axios');

async function testAgentOrdersFlow() {
  try {
    console.log('🔍 测试代理订单完整流程...\n');
    
    // 1. 代理登录
    console.log('1. 代理登录测试:');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'agent@ttkh.com',
      password: 'agent123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 代理登录成功');
      console.log(`   用户ID: ${loginResponse.data.data.user.id}`);
      console.log(`   用户名: ${loginResponse.data.data.user.username}`);
      console.log(`   角色: ${loginResponse.data.data.user.role}`);
      
      const token = loginResponse.data.data.token;
      const agentId = loginResponse.data.data.user.id;
      
      // 2. 获取订单列表
      console.log('\n2. 获取代理订单列表:');
      const ordersResponse = await axios.get('http://localhost:3002/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (ordersResponse.data.success) {
        console.log('📋 完整响应数据:', JSON.stringify(ordersResponse.data, null, 2));
        
        const orders = ordersResponse.data.data;
        console.log('📊 订单数据类型:', typeof orders);
        console.log('📊 订单数据是否为数组:', Array.isArray(orders));
        
        if (Array.isArray(orders)) {
          console.log(`✅ 订单查询成功，找到 ${orders.length} 条订单:`);
          orders.forEach((order, index) => {
            console.log(`   ${index + 1}. 订单ID: ${order.id}, 订单号: ${order.order_no}, 代理ID: ${order.agent_id}, 客户: ${order.customer_name}`);
          });
          
          // 3. 检查是否有代理订单
          const agentOrders = orders.filter(order => order.agent_id === agentId);
          console.log(`\n📊 属于当前代理的订单数量: ${agentOrders.length}`);
          
          if (agentOrders.length > 0) {
            console.log('✅ 代理订单查询正常');
          } else {
            console.log('⚠️  没有找到属于当前代理的订单');
          }
        } else {
          console.log('❌ 返回的数据不是数组格式');
        }
        
      } else {
        console.log('❌ 订单查询失败:', ordersResponse.data.message);
      }
      
      // 4. 测试创建新订单
      console.log('\n3. 测试代理创建新订单:');
      
      // 先获取可用产品
      const productsResponse = await axios.get('http://localhost:3002/api/products');
      if (productsResponse.data.success && productsResponse.data.data.products.length > 0) {
        const testProduct = productsResponse.data.data.products[0];
        console.log(`使用测试产品: ${testProduct.title_zh} (ID: ${testProduct.id})`);
        
        // 获取价格日历
        const schedulesResponse = await axios.get(`http://localhost:3002/api/products/${testProduct.id}/schedules`);
        if (schedulesResponse.data.success && schedulesResponse.data.data.schedules.length > 0) {
          const testSchedule = schedulesResponse.data.data.schedules[0];
          const travelDate = new Date(testSchedule.travel_date).toISOString().split('T')[0];
          
          console.log(`使用价格日历: 日期=${travelDate}, 价格=${testSchedule.price}`);
          
          // 创建订单
          const orderData = {
            product_id: testProduct.id,
            travel_date: travelDate,
            adults: 1,
            children_no_bed: 0,
            children_with_bed: 0,
            infants: 0,
            total_people: 1,
            unit_price: testSchedule.price,
            total_price: testSchedule.price * 1,
            customer_name: '前端测试客户',
            customer_phone: '0987654321',
            customer_email: 'frontend-test@test.com',
            notes: '前端代理测试订单'
          };
          
          const createOrderResponse = await axios.post('http://localhost:3002/api/orders', orderData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (createOrderResponse.data.success) {
            console.log('✅ 代理订单创建成功');
            console.log(`   订单ID: ${createOrderResponse.data.data.orderId}`);
            console.log(`   订单号: ${createOrderResponse.data.data.orderNumber}`);
            
            // 5. 再次查询订单列表验证
            console.log('\n4. 验证新订单是否出现在列表中:');
            const newOrdersResponse = await axios.get('http://localhost:3002/api/orders', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (newOrdersResponse.data.success) {
              const newAgentOrders = newOrdersResponse.data.data.filter(order => order.agent_id === agentId);
              console.log(`✅ 更新后的代理订单数量: ${newAgentOrders.length}`);
              
              const newOrder = newOrdersResponse.data.data.find(order => order.id === createOrderResponse.data.data.orderId);
              if (newOrder) {
                console.log('✅ 新创建的订单已出现在列表中');
                console.log(`   订单详情: ID=${newOrder.id}, 代理ID=${newOrder.agent_id}, 客户=${newOrder.customer_name}`);
              } else {
                console.log('❌ 新创建的订单未出现在列表中');
              }
            }
            
          } else {
            console.log('❌ 代理订单创建失败:', createOrderResponse.data.message);
          }
          
        } else {
          console.log('❌ 没有找到价格日历');
        }
      } else {
        console.log('❌ 没有找到可用产品');
      }
      
    } else {
      console.log('❌ 代理登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testAgentOrdersFlow().then(() => {
  console.log('\n🎉 测试完成！');
}).catch(console.error);