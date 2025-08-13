const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Flameaway3.',
  database: 'tourism_system'
};

async function implementCompleteBusinessFlow() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 确保所有必要的表结构正确
    await ensureTableStructures(connection);
    
    // 2. 创建测试商家账号
    await createTestMerchantAccount(connection);
    
    // 3. 创建管理员账号用于审核
    await createAdminAccount(connection);
    
    // 4. 创建测试用户（代理）账号
    await createTestAgentAccount(connection);
    
    // 5. 测试完整业务流程
    await testCompleteBusinessFlow(connection);
    
    console.log('🎉 完整业务流程实现完成！');
    
  } catch (error) {
    console.error('❌ 实现过程中出错:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function ensureTableStructures(connection) {
  console.log('📋 确保表结构正确...');
  
  // 确保用户表有正确的字段
  await connection.execute(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected', 'active') DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS business_license VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address TEXT
  `);
  
  // 确保产品表有正确的字段
  await connection.execute(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS product_number VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS poster_image VARCHAR(500),
    ADD COLUMN IF NOT EXISTS pdf_document VARCHAR(500),
    ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT
  `);
  
  // 确保订单表有正确的字段
  await connection.execute(`
    ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS scan_document VARCHAR(500),
    ADD COLUMN IF NOT EXISTS status ENUM('pending', 'confirmed', 'rejected', 'archived') DEFAULT 'pending'
  `);
  
  // 创建价格日历表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS price_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      date DATE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_product_date (product_id, date)
    )
  `);
  
  console.log('✅ 表结构确保完成');
}

async function createTestMerchantAccount(connection) {
  console.log('👤 创建测试商家账号...');
  
  // 检查是否已存在
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ? AND role = ?',
    ['merchant@test.com', 'merchant']
  );
  
  if (existing.length === 0) {
    await connection.execute(`
      INSERT INTO users (
        username, email, password, role, status, 
        business_name, business_license, contact_phone, address,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'testmerchant',
      'merchant@test.com', 
      'password123',
      'merchant',
      'pending',
      '测试旅游公司',
      'BL123456789',
      '02-123-4567',
      '曼谷市中心商业区'
    ]);
    console.log('✅ 测试商家账号创建成功 (状态: 待审核)');
  } else {
    console.log('ℹ️ 测试商家账号已存在');
  }
}

async function createAdminAccount(connection) {
  console.log('👑 创建管理员账号...');
  
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ? AND role = ?',
    ['admin@test.com', 'admin']
  );
  
  if (existing.length === 0) {
    await connection.execute(`
      INSERT INTO users (
        username, email, password, role, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'admin',
      'admin@test.com',
      'admin123',
      'admin',
      'active'
    ]);
    console.log('✅ 管理员账号创建成功');
  } else {
    console.log('ℹ️ 管理员账号已存在');
  }
}

async function createTestAgentAccount(connection) {
  console.log('🎯 创建测试代理账号...');
  
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ? AND role = ?',
    ['agent@test.com', 'agent']
  );
  
  if (existing.length === 0) {
    await connection.execute(`
      INSERT INTO users (
        username, email, password, role, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'testagent',
      'agent@test.com',
      'agent123',
      'agent',
      'active'
    ]);
    console.log('✅ 测试代理账号创建成功');
  } else {
    console.log('ℹ️ 测试代理账号已存在');
  }
}

async function testCompleteBusinessFlow(connection) {
  console.log('🔄 开始测试完整业务流程...');
  
  // 1. 管理员审核商家
  console.log('1️⃣ 管理员审核商家账号...');
  await connection.execute(
    'UPDATE users SET status = ? WHERE email = ? AND role = ?',
    ['approved', 'merchant@test.com', 'merchant']
  );
  console.log('✅ 商家账号审核通过');
  
  // 2. 获取商家ID
  const [merchantResult] = await connection.execute(
    'SELECT id FROM users WHERE email = ? AND role = ?',
    ['merchant@test.com', 'merchant']
  );
  const merchantId = merchantResult[0].id;
  
  // 3. 商家创建产品
  console.log('2️⃣ 商家创建产品...');
  const productNumber = generateProductNumber();
  
  await connection.execute(`
    INSERT INTO products (
      name, description, price, merchant_id, product_number,
      poster_image, pdf_document, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [
    '曼谷一日游套餐',
    '包含大皇宫、卧佛寺、郑王庙等著名景点的一日游套餐',
    1500.00,
    merchantId,
    productNumber,
    '/downloads/bangkok-tour-poster.jpg',
    '/downloads/bangkok-tour-details.pdf',
    'pending'
  ]);
  
  const [productResult] = await connection.execute(
    'SELECT id FROM products WHERE product_number = ?',
    [productNumber]
  );
  const productId = productResult[0].id;
  
  console.log(`✅ 产品创建成功，产品编号: ${productNumber}`);
  
  // 4. 设置价格日历
  console.log('3️⃣ 设置价格日历...');
  const dates = getNext30Days();
  for (const date of dates) {
    await connection.execute(`
      INSERT INTO price_schedules (product_id, date, price, stock)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE price = VALUES(price), stock = VALUES(stock)
    `, [productId, date, 1500.00, 10]);
  }
  console.log('✅ 价格日历设置完成');
  
  // 5. 管理员审核产品
  console.log('4️⃣ 管理员审核产品...');
  await connection.execute(
    'UPDATE products SET status = ? WHERE id = ?',
    ['approved', productId]
  );
  console.log('✅ 产品审核通过，已展示到首页');
  
  // 6. 获取代理ID
  const [agentResult] = await connection.execute(
    'SELECT id FROM users WHERE email = ? AND role = ?',
    ['agent@test.com', 'agent']
  );
  const agentId = agentResult[0].id;
  
  // 7. 代理下单
  console.log('5️⃣ 代理下单...');
  const orderNumber = generateOrderNumber();
  
  await connection.execute(`
    INSERT INTO orders (
      order_number, user_id, product_id, quantity, total_amount,
      scan_document, status, travel_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [
    orderNumber,
    agentId,
    productId,
    2,
    3000.00,
    '/downloads/payment-scan.jpg',
    'pending',
    '2024-02-15'
  ]);
  
  console.log(`✅ 订单创建成功，订单号: ${orderNumber}`);
  
  console.log('🎉 完整业务流程测试完成！');
  
  // 显示测试结果摘要
  await displayTestSummary(connection);
}

function generateProductNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PRD${timestamp}${random}`;
}

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
}

function getNext30Days() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

async function displayTestSummary(connection) {
  console.log('\n📊 测试结果摘要:');
  console.log('='.repeat(50));
  
  // 用户统计
  const [users] = await connection.execute(`
    SELECT role, status, COUNT(*) as count 
    FROM users 
    GROUP BY role, status
  `);
  
  console.log('👥 用户统计:');
  users.forEach(user => {
    console.log(`   ${user.role} (${user.status}): ${user.count}个`);
  });
  
  // 产品统计
  const [products] = await connection.execute(`
    SELECT status, COUNT(*) as count 
    FROM products 
    GROUP BY status
  `);
  
  console.log('📦 产品统计:');
  products.forEach(product => {
    console.log(`   ${product.status}: ${product.count}个`);
  });
  
  // 订单统计
  const [orders] = await connection.execute(`
    SELECT status, COUNT(*) as count 
    FROM orders 
    GROUP BY status
  `);
  
  console.log('📋 订单统计:');
  orders.forEach(order => {
    console.log(`   ${order.status}: ${order.count}个`);
  });
  
  console.log('='.repeat(50));
}

// 运行实现
implementCompleteBusinessFlow().catch(console.error);