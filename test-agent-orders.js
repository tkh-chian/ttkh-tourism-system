const mysql = require('mysql2/promise');

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function testAgentOrders() {
  let connection;
  
  try {
    console.log('🔍 测试代理订单功能...\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');
    
    // 1. 获取代理用户
    console.log('\n📋 获取代理用户...');
    const [agents] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "agent"'
    );
    
    if (agents.length === 0) {
      console.log('❌ 没有找到代理用户');
      return;
    }
    
    const agent = agents[0];
    console.log(`✅ 找到代理用户: ${agent.username} (ID: ${agent.id})`);
    
    // 2. 检查代理的客户
    console.log('\n📋 检查代理的客户...');
    const [customers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE agent_id = ? AND role = "user"',
      [agent.id]
    );
    
    console.log(`✅ 代理有 ${customers.length} 个客户`);
    customers.forEach(customer => {
      console.log(`   - ${customer.username} (${customer.email})`);
    });
    
    // 3. 检查代理相关的订单（改为先查询 o.*，再单独查询产品/客户信息以规避逗号被环境移除的问题）
    console.log('\n📋 检查代理相关的订单...');
    const ordersSql = 'SELECT o.* FROM orders o JOIN users u ON o.user_id = u.id WHERE u.agent_id = ? ORDER BY o.createdAt DESC';
    console.log('DEBUG ordersSql raw:', ordersSql);
    console.log('DEBUG params:', JSON.stringify([agent.id]));
    const [orders] = await connection.execute(ordersSql, [agent.id]);
    
    console.log(`✅ 找到 ${orders.length} 个代理订单`);
    
    if (orders.length > 0) {
      console.log('\n订单详情:');
      for (const order of orders) {
        // 单独查询产品标题，避免在主 SQL 中使用带逗号的列清单
        let product_title = '(无)';
        try {
          const [prodRows] = await connection.execute('SELECT title_zh FROM products WHERE id = ? LIMIT 1', [order.product_id]);
          if (prodRows.length > 0) product_title = prodRows[0].title_zh;
        } catch (e) {
          // 忽略单条关联查询失败，继续展示其它字段
        }
        const customerInfo = typeof order.customer_info === 'string' ? order.customer_info : JSON.stringify(order.customer_info);
        console.log(`   - 订单号: ${order.order_number}`);
        console.log(`     客户信息: ${customerInfo}`);
        console.log(`     产品: ${product_title}`);
        console.log(`     人数: ${order.quantity}人`);
        console.log(`     金额: ¥${order.total_amount}`);
        console.log(`     状态: ${order.status}`);
        console.log(`     时间: ${order.createdAt}`);
        console.log('');
      }
    } else {
      console.log('⚠️  没有找到代理订单，创建测试订单...');
      
      // 创建测试订单
      if (customers.length > 0) {
        // 获取一个已审核（approved 或其它）产品；若无则取任意产品
        const [products] = await connection.execute(
          'SELECT id, title_zh, base_price FROM products WHERE status = "approved" LIMIT 1'
        );
        
        let product;
        if (products.length === 0) {
          const [anyProd] = await connection.execute('SELECT id, title_zh, base_price, status FROM products LIMIT 1');
          if (anyProd.length === 0) {
            console.log('❌ 未找到可用产品，无法创建订单');
          } else {
            product = anyProd[0];
          }
        } else {
          product = products[0];
        }

        if (product) {
          const customer = customers[0];
          
          // 生成订单号
          const orderNumber = 'TT' + Date.now() + Math.floor(Math.random() * 1000);

          // 插入订单，使用 orders 表实际列（order_number, user_id, product_id, agent_id, booking_date, quantity, total_amount, customer_info, status, createdAt）
          await connection.execute(
            'INSERT INTO orders (order_number, user_id, product_id, agent_id, booking_date, quantity, total_amount, customer_info, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
              orderNumber,
              customer.id,
              product.id,
              agent.id,
              '2025-02-15',
              2,
              product.base_price * 2,
              JSON.stringify({ name: customer.username, email: customer.email, phone: '123-456-7890' }),
              'pending'
            ]
          );
          
          console.log('✅ 测试订单创建成功');
          console.log(`   订单号: ${orderNumber}`);
          console.log(`   客户: ${customer.username}`);
          console.log(`   产品: ${product.title_zh}`);
        }
      }
    }
    
    // 4. 测试API查询（改为只查询 o.*，后续按需单独查询关联数据）
    console.log('\n📋 测试订单API查询...');
    const apiSql = 'SELECT o.* FROM orders o JOIN users u ON o.user_id = u.id WHERE u.agent_id = ? ORDER BY o.createdAt DESC';
    console.log('DEBUG apiSql raw:', apiSql);
    console.log('DEBUG params (api):', JSON.stringify([agent.id]));
    const [apiOrders] = await connection.execute(apiSql, [agent.id]);
    
    console.log(`✅ API查询返回 ${apiOrders.length} 个订单`);
    
    if (apiOrders.length > 0) {
      console.log('\nAPI返回的订单数据结构:');
      const sampleOrder = apiOrders[0];
      console.log('   字段列表:');
      Object.keys(sampleOrder).forEach(key => {
        console.log(`     - ${key}: ${sampleOrder[key]}`);
      });
    }
    
    console.log('\n✅ 代理订单功能测试完成！');
    console.log('\n📝 测试结果:');
    console.log(`   ✅ 代理用户: ${agent.username}`);
    console.log(`   ✅ 关联客户: ${customers.length} 个`);
    console.log(`   ✅ 代理订单: ${orders.length} 个`);
    console.log(`   ✅ API查询: 正常`);
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 数据库连接已关闭');
    }
  }
}

// 运行测试
testAgentOrders();