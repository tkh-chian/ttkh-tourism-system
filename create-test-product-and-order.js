const mysql = require('mysql2/promise');

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function createTestProductAndOrder() {
  let connection;
  
  try {
    console.log('🔍 创建测试产品和订单...\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');
    
    // 1. 获取代理用户
    console.log('\n📋 获取代理用户...');
    const [agents] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "agent" LIMIT 1'
    );
    
    if (agents.length === 0) {
      console.log('❌ 没有找到代理用户');
      return;
    }
    
    const agent = agents[0];
    console.log(`✅ 找到代理用户: ${agent.username} (ID: ${agent.id})`);
    
    // 2. 获取代理关联的客户
    console.log('\n📋 获取代理关联的客户...');
    const [customers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE agent_id = ? AND role = "customer" LIMIT 1',
      [agent.id]
    );
    
    if (customers.length === 0) {
      console.log('❌ 没有找到代理关联的客户');
      return;
    }
    
    const customer = customers[0];
    console.log(`✅ 找到客户: ${customer.username} (ID: ${customer.id})`);
    
    // 3. 获取或创建商家用户
    console.log('\n📋 获取或创建商家用户...');
    let [merchants] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "merchant" LIMIT 1'
    );
    
    let merchant;
    if (merchants.length === 0) {
      console.log('⚠️ 没有找到商家用户，创建测试商家...');
      const merchantUsername = `merchant_${Date.now().toString().slice(-6)}`;
      const merchantEmail = `${merchantUsername}@test.com`;
      const passwordHash = '$2a$10$XvXWZ3Gy4SQGSm3Ry3oB8eVA.J5HRN1zQNdxvYGRnpX0nJ0KQUzLq'; // 明文密码: password123
      
      await connection.execute(
        'INSERT INTO users (id, username, email, password, role, status, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())',
        [merchantUsername, merchantEmail, passwordHash, 'merchant', 'active']
      );
      
      [merchants] = await connection.execute(
        'SELECT id, username, email FROM users WHERE username = ?',
        [merchantUsername]
      );
      
      merchant = merchants[0];
      console.log(`✅ 测试商家创建成功: ${merchant.username} (ID: ${merchant.id})`);
    } else {
      merchant = merchants[0];
      console.log(`✅ 找到商家: ${merchant.username} (ID: ${merchant.id})`);
    }
    
    // 4. 获取或创建测试产品
    console.log('\n📋 获取或创建测试产品...');
    let [products] = await connection.execute(
      'SELECT id, title_zh, base_price FROM products WHERE merchant_id = ? LIMIT 1',
      [merchant.id]
    );
    
    let product;
    if (products.length === 0) {
      console.log('⚠️ 没有找到产品，创建测试产品...');
      const productTitle = `测试产品_${Date.now().toString().slice(-6)}`;
      const productNumber = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await connection.execute(
        'INSERT INTO products (id, product_number, title_zh, title_th, title_en, description_zh, description_th, description_en, base_price, status, merchant_id, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          productNumber,
          productTitle,
          `${productTitle} (泰文)`,
          `${productTitle} (英文)`,
          '这是一个测试产品描述',
          '这是一个测试产品描述 (泰文)',
          '这是一个测试产品描述 (英文)',
          99.99,
          'approved',
          merchant.id
        ]
      );
      
      [products] = await connection.execute(
        'SELECT id, title_zh, base_price, product_number FROM products WHERE merchant_id = ? ORDER BY createdAt DESC LIMIT 1',
        [merchant.id]
      );
      
      product = products[0];
      console.log(`✅ 测试产品创建成功: ${product.title_zh} (ID: ${product.id}, 产品编号: ${product.product_number})`);
    } else {
      product = products[0];
      console.log(`✅ 找到产品: ${product.title_zh} (ID: ${product.id})`);
    }
    
    // 5. 创建测试订单
    console.log('\n📋 创建测试订单...');
    const orderNumber = 'TT' + Date.now() + Math.floor(Math.random() * 1000);
    const quantity = 2;
    const totalAmount = product.base_price * quantity;
    const customerInfo = JSON.stringify({
      name: customer.username,
      email: customer.email,
      phone: '123-456-7890'
    });
    
    await connection.execute(
      'INSERT INTO orders (id, order_number, user_id, product_id, quantity, total_amount, status, payment_status, booking_date, customer_info, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        orderNumber,
        customer.id,
        product.id,
        quantity,
        totalAmount,
        'pending',
        'pending',
        '2025-02-15',
        customerInfo
      ]
    );
    
    console.log(`✅ 测试订单创建成功: ${orderNumber}`);
    console.log(`   客户: ${customer.username}`);
    console.log(`   产品: ${product.title_zh}`);
    console.log(`   数量: ${quantity}`);
    console.log(`   总金额: ${totalAmount}`);
    
    // 6. 验证订单创建
    const [orders] = await connection.execute(
      'SELECT o.*, p.title_zh FROM orders o JOIN products p ON o.product_id = p.id WHERE o.order_number = ?',
      [orderNumber]
    );
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log('\n📋 验证订单信息:');
      console.log(`   订单号: ${order.order_number}`);
      console.log(`   用户ID: ${order.user_id}`);
      console.log(`   产品: ${order.title_zh}`);
      console.log(`   数量: ${order.quantity}`);
      console.log(`   总金额: ${order.total_amount}`);
      console.log(`   状态: ${order.status}`);
      console.log(`   创建时间: ${order.createdAt}`);
    }
    
    console.log('\n✅ 测试产品和订单创建完成！');
    
  } catch (error) {
    console.error('❌ 创建测试产品和订单过程中出现错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 数据库连接已关闭');
    }
  }
}

// 运行函数
createTestProductAndOrder();