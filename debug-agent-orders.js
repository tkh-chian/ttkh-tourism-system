const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ttkh-secret-key-2025';

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function debugAgentOrders() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🔍 开始调试代理订单问题...\n');
    
    // 1. 检查代理用户
    console.log('1. 检查代理用户:');
    const [agents] = await connection.execute('SELECT * FROM users WHERE role = "agent"');
    console.log(`找到 ${agents.length} 个代理用户:`);
    agents.forEach(agent => {
      console.log(`  - ID: ${agent.id}, 用户名: ${agent.username}, 邮箱: ${agent.email}`);
    });
    
    if (agents.length === 0) {
      console.log('❌ 没有找到代理用户，创建一个测试代理...');
      const hashedPassword = bcrypt.hashSync('agent123', 10);
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        ['testagent', 'agent@test.com', hashedPassword, 'agent', 'active']
      );
      console.log(`✅ 创建代理用户成功，ID: ${result.insertId}`);
      
      // 重新查询
      const [newAgents] = await connection.execute('SELECT * FROM users WHERE role = "agent"');
      agents.push(...newAgents);
    }
    
    const testAgent = agents[0];
    console.log(`\n使用测试代理: ${testAgent.username} (ID: ${testAgent.id})\n`);
    
    // 2. 检查产品
    console.log('2. 检查可用产品:');
    const [products] = await connection.execute('SELECT * FROM products WHERE status = "approved" LIMIT 1');
    if (products.length === 0) {
      console.log('❌ 没有找到已审核的产品');
      return;
    }
    
    const testProduct = products[0];
    console.log(`找到测试产品: ${testProduct.title_zh} (ID: ${testProduct.id})`);
    
    // 3. 检查价格日历
    console.log('\n3. 检查价格日历:');
    const [schedules] = await connection.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? LIMIT 1',
      [testProduct.id]
    );
    
    if (schedules.length === 0) {
      console.log('❌ 没有找到价格日历，创建一个测试日程...');
      const testDate = '2025-02-15';
      await connection.execute(
        'INSERT INTO price_schedules (product_id, travel_date, price, total_stock, available_stock) VALUES (?, ?, ?, ?, ?)',
        [testProduct.id, testDate, 1000, 10, 10]
      );
      console.log(`✅ 创建价格日历成功: ${testDate}, 价格: 1000`);
      
      // 重新查询
      const [newSchedules] = await connection.execute(
        'SELECT * FROM price_schedules WHERE product_id = ?',
        [testProduct.id]
      );
      schedules.push(...newSchedules);
    }
    
    const testSchedule = schedules[0];
    console.log(`找到价格日历: 日期=${testSchedule.travel_date}, 价格=${testSchedule.price}, 库存=${testSchedule.available_stock}`);
    
    // 4. 模拟代理创建订单
    console.log('\n4. 模拟代理创建订单:');
    
    const orderData = {
      product_id: testProduct.id,
      travel_date: testSchedule.travel_date.toISOString().split('T')[0],
      adults: 2,
      children_no_bed: 0,
      children_with_bed: 0,
      infants: 0,
      total_people: 2,
      unit_price: testSchedule.price,
      total_price: testSchedule.price * 2,
      customer_name: '测试客户',
      customer_phone: '1234567890',
      customer_email: 'customer@test.com',
      notes: '代理测试订单'
    };
    
    console.log('订单数据:', orderData);
    
    // 生成订单号
    const orderNumber = 'TT' + Date.now() + Math.floor(Math.random() * 1000);
    
    // 计算订单金额
    const calculatedTotalAmount = parseFloat(orderData.unit_price) * orderData.total_people;
    const finalAmount = calculatedTotalAmount;
    
    // 设置代理ID
    const agentId = testAgent.id;
    
    console.log(`代理ID: ${agentId}`);
    console.log(`订单号: ${orderNumber}`);
    console.log(`总金额: ${finalAmount}`);
    
    // 创建订单
    const contactInfo = {
      name: orderData.customer_name,
      phone: orderData.customer_phone,
      email: orderData.customer_email
    };
    
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        order_no, user_id, merchant_id, product_id, travel_date,
        adults, children_no_bed, children_with_bed, infants, total_people,
        unit_price, total_price, total_amount, final_amount, customer_name,
        customer_phone, customer_email, contact_info, notes, agent_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, testAgent.id, testProduct.merchant_id, testProduct.id, orderData.travel_date,
        orderData.adults, orderData.children_no_bed, orderData.children_with_bed, orderData.infants, orderData.total_people,
        parseFloat(orderData.unit_price), parseFloat(orderData.total_price), calculatedTotalAmount, finalAmount, orderData.customer_name,
        orderData.customer_phone, orderData.customer_email, JSON.stringify(contactInfo), orderData.notes, agentId
      ]
    );
    
    console.log(`✅ 订单创建成功，ID: ${orderResult.insertId}`);
    
    // 5. 验证订单是否正确保存
    console.log('\n5. 验证订单保存:');
    const [createdOrders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderResult.insertId]
    );
    
    if (createdOrders.length > 0) {
      const order = createdOrders[0];
      console.log('✅ 订单保存成功:');
      console.log(`  - 订单ID: ${order.id}`);
      console.log(`  - 订单号: ${order.order_no}`);
      console.log(`  - 用户ID: ${order.user_id}`);
      console.log(`  - 代理ID: ${order.agent_id}`);
      console.log(`  - 产品ID: ${order.product_id}`);
      console.log(`  - 客户姓名: ${order.customer_name}`);
      console.log(`  - 总金额: ${order.final_amount}`);
    } else {
      console.log('❌ 订单保存失败');
    }
    
    // 6. 测试代理订单查询
    console.log('\n6. 测试代理订单查询:');
    const [agentOrders] = await connection.execute(`
      SELECT 
        o.*,
        u.username as customer_name,
        u.email as customer_email,
        p.title_zh as product_title,
        p.base_price as product_price,
        m.username as merchant_name,
        a.username as agent_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users m ON p.merchant_id = m.id
      LEFT JOIN users a ON o.agent_id = a.id
      WHERE o.agent_id = ?
      ORDER BY o.created_at DESC
    `, [testAgent.id]);
    
    console.log(`找到 ${agentOrders.length} 条代理订单:`);
    agentOrders.forEach(order => {
      console.log(`  - 订单ID: ${order.id}, 订单号: ${order.order_no}, 代理ID: ${order.agent_id}, 客户: ${order.customer_name}`);
    });
    
    // 7. 检查所有订单的agent_id字段
    console.log('\n7. 检查所有订单的agent_id字段:');
    const [allOrders] = await connection.execute('SELECT id, order_no, user_id, agent_id, customer_name FROM orders ORDER BY created_at DESC LIMIT 10');
    console.log('最近10条订单:');
    allOrders.forEach(order => {
      console.log(`  - ID: ${order.id}, 订单号: ${order.order_no}, 用户ID: ${order.user_id}, 代理ID: ${order.agent_id || 'NULL'}, 客户: ${order.customer_name}`);
    });
    
    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
  } finally {
    await connection.end();
  }
}

// 运行调试
debugAgentOrders().catch(console.error);