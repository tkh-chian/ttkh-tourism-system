const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

// SQL建表语句
const createTables = `
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ttkh_tourism CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ttkh_tourism;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  role ENUM('customer', 'merchant', 'agent', 'admin') DEFAULT 'customer',
  status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
  company_name VARCHAR(100),
  contact_person VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  merchant_id VARCHAR(36) NOT NULL,
  title_zh VARCHAR(200) NOT NULL,
  title_th VARCHAR(200) NOT NULL,
  description_zh TEXT,
  description_th TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  poster_image TEXT,
  poster_filename VARCHAR(255),
  pdf_file TEXT,
  pdf_filename VARCHAR(255),
  status ENUM('draft', 'pending', 'approved', 'rejected', 'archived') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  order_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 价格日历表
CREATE TABLE IF NOT EXISTS price_schedules (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  travel_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_stock INT NOT NULL DEFAULT 0,
  available_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_date (product_id, travel_date)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  merchant_id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) DEFAULT NULL,
  customer_id VARCHAR(36) DEFAULT NULL,
  product_title VARCHAR(200) NOT NULL,
  travel_date DATE NOT NULL,
  adults INT DEFAULT 0,
  children_no_bed INT DEFAULT 0,
  children_with_bed INT DEFAULT 0,
  infants INT DEFAULT 0,
  total_people INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  agent_markup DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending', 'confirmed', 'rejected', 'archived', 'returned') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'confirmed') DEFAULT 'unpaid',
  payment_screenshot TEXT,
  return_pdf TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (merchant_id) REFERENCES users(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);
`;

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    
    // 先连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    console.log('✅ 数据库连接成功');
    
    // 执行建表语句
    console.log('📋 创建数据库表...');
    const statements = createTables.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log('✅ 数据库表创建成功');
    
    // 重新连接到指定数据库
    await connection.end();
    connection = await mysql.createConnection(dbConfig);
    
    // 创建测试用户
    console.log('👥 创建测试用户...');
    
    const { v4: uuidv4 } = require('uuid');
    const testUsers = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@ttkh.com',
        role: 'admin',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试商家',
        email: 'merchant@test.com',
        role: 'merchant',
        status: 'approved',
        company_name: '泰享游旅行社',
        contact_person: '张经理'
      },
      {
        id: uuidv4(),
        username: '测试代理',
        email: 'agent@test.com',
        role: 'agent',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试用户',
        email: 'user@test.com',
        role: 'customer',
        status: 'approved'
      }
    ];
    
    for (const user of testUsers) {
      await connection.execute(
        `INSERT IGNORE INTO users (id, username, email, role, status, company_name, contact_person) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.email, user.role, user.status, user.company_name || null, user.contact_person || null]
      );
    }
    
    console.log('✅ 测试用户创建成功');
    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 测试账户信息:');
    console.log('   管理员: admin@ttkh.com / admin123');
    console.log('   商家: merchant@test.com / 123456');
    console.log('   代理: agent@test.com / 123456');
    console.log('   用户: user@test.com / 123456');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initDatabase();