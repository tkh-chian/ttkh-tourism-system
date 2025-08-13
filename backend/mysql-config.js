require('dotenv').config();
const mysql = require('mysql2/promise');

// MySQL数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ttkh_tourism',
  host: 'localhost',
  user: 'root',
  password: '', // 请根据您的MySQL设置修改密码
  database: 'ttkh_tourism',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
let pool;

async function initDatabase() {
  try {
    console.log('🔗 正在连接MySQL数据库...');
    
    // 首先连接到MySQL服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: 'utf8mb4'
    });

    // 创建数据库（如果不存在）
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 数据库创建成功');
    
    await connection.end();

    // 创建连接池
    pool = mysql.createPool(dbConfig);
    
    // 测试连接
    const testConnection = await pool.getConnection();
    await testConnection.ping();
    testConnection.release();
    
    console.log('✅ MySQL数据库连接成功');
    
    // 创建表
    await createTables();
    
    // 插入测试数据
    await insertTestData();
    
    return pool;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
console.error('🔍 连接参数:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database, port: 3306 });
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔧 MySQL连接配置说明:');
      console.log('1. 请确保MySQL服务正在运行');
      console.log('2. 检查用户名和密码是否正确');
      console.log('3. 如果MySQL有密码，请修改 mysql-config.js 中的 password 字段');
      console.log('4. 确保root用户有创建数据库的权限');
      console.log('\n💡 常见解决方案:');
      console.log('- 如果是新安装的MySQL，可能需要设置root密码');
      console.log('- 可以尝试使用 mysql -u root -p 命令测试连接');
    }
    
    throw error;
  }
}

async function createTables() {
  try {
    console.log('📋 创建数据库表...');
    
    const tables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar TEXT,
        role ENUM('customer', 'merchant', 'agent', 'admin') DEFAULT 'customer',
        status ENUM('pending', 'approved', 'rejected', 'banned') DEFAULT 'pending',
        company_name VARCHAR(100),
        contact_person VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 产品表
      `CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        merchant_id VARCHAR(36) NOT NULL,
        title_zh VARCHAR(200) NOT NULL,
        title_th VARCHAR(200) NOT NULL,
        description_zh TEXT,
        description_th TEXT,
        base_price DECIMAL(10,2) NOT NULL,
        poster_image LONGTEXT,
        poster_filename VARCHAR(255),
        pdf_file LONGTEXT,
        pdf_filename VARCHAR(255),
        status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
        view_count INT DEFAULT 0,
        order_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 价格日历表
      `CREATE TABLE IF NOT EXISTS price_schedules (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        travel_date DATE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total_stock INT NOT NULL DEFAULT 0,
        available_stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_date (product_id, travel_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 订单表
      `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        merchant_id VARCHAR(36) NOT NULL,
        agent_id VARCHAR(36),
        customer_id VARCHAR(36),
        product_title VARCHAR(200) NOT NULL,
        travel_date DATE NOT NULL,
        adults INT DEFAULT 0,
        children_no_bed INT DEFAULT 0,
        children_with_bed INT DEFAULT 0,
        infants INT DEFAULT 0,
        total_people INT NOT NULL,
        customer_name VARCHAR(50) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100),
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        agent_markup DECIMAL(10,2) DEFAULT 0,
        status ENUM('pending', 'confirmed', 'rejected', 'archived', 'returned') DEFAULT 'pending',
        payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const sql of tables) {
      await pool.execute(sql);
    }
    
    console.log('✅ 数据库表创建成功');
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    throw error;
  }
}

async function insertTestData() {
  try {
    console.log('👥 插入测试数据...');
    
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    const testUsers = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@ttkh.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试商家',
        email: 'merchant@test.com',
        password: await bcrypt.hash('123456', 10),
        role: 'merchant',
        status: 'approved',
        company_name: '泰享游旅行社',
        contact_person: '张经理'
      },
      {
        id: uuidv4(),
        username: '测试代理',
        email: 'agent@test.com',
        password: await bcrypt.hash('123456', 10),
        role: 'agent',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试用户',
        email: 'user@test.com',
        password: await bcrypt.hash('123456', 10),
        role: 'customer',
        status: 'approved'
      }
    ];

    for (const user of testUsers) {
      await pool.execute(
        `INSERT IGNORE INTO users (id, username, email, password_hash, role, status, company_name, contact_person) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.email, user.password, user.role, user.status, user.company_name || null, user.contact_person || null]
      );
    }
    
    console.log('✅ 测试数据插入成功');
  } catch (error) {
    console.error('❌ 插入测试数据失败:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }
  return pool;
}

module.exports = {
  initDatabase,
  getPool,
  dbConfig
};