const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'ttkh-secret-key-2025';

// MySQL数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ttkh_tourism',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 数据库连接池
let pool;

async function initDB() {
  try {
    // 先连接到MySQL服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // 创建数据库（如果不存在）
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 数据库创建成功');
    
    await connection.end();

    // 创建连接池
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL连接池创建成功');

    // 创建表
    await createTables();
    
    // 插入测试数据
    await insertTestData();
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

async function createTables() {
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
      agent_id VARCHAR(36) NULL,
      customer_id VARCHAR(36) NULL,
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
      payment_screenshot LONGTEXT,
      return_pdf LONGTEXT,
      rejection_reason TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (merchant_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  for (const sql of tables) {
    try {
      await pool.execute(sql);
    } catch (error) {
      console.error('创建表失败:', error);
      throw error;
    }
  }
  
  console.log('✅ 数据库表创建成功');
}

async function insertTestData() {
  try {
    console.log('👥 创建测试用户...');
    
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
      try {
        await pool.execute(
          `INSERT IGNORE INTO users (id, username, email, password_hash, role, status, company_name, contact_person) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.username, user.email, user.password, user.role, user.status, user.company_name || null, user.contact_person || null]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error('插入用户失败:', error);
        }
      }
    }
    
    console.log('✅ 测试用户创建成功');
  } catch (error) {
    console.error('插入测试数据失败:', error);
    throw error;
  }
}

// 认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '无效的访问令牌' });
  }
};

// ==================== 认证路由 ====================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'customer', company_name, contact_person, phone } = req.body;

    // 检查邮箱是否已存在
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '邮箱已被注册' });
    }

    // 加密密码
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 插入用户
    await pool.execute(
      `INSERT INTO users (id, username, email, password_hash, role, company_name, contact_person, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, email, password_hash, role, company_name || null, contact_person || null, phone || null, 'pending']
    );

    res.json({
      success: true,
      message: '注册成功，请等待管理员审核',
      data: { userId }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: '邮箱或密码错误' });
    }

    const user = rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '邮箱或密码错误' });
    }

    // 检查账户状态
    if (user.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: user.status === 'pending' ? '账户待审核' : '账户已被禁用' 
      });
    }

    // 生成JWT令牌
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // 移除密码字段
    delete user.password_hash;

    res.json({
      success: true,
      message: '登录成功',
      data: { user, token }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 获取用户信息
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password_hash;
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// ==================== 产品路由 ====================

// 获取产品列表
app.get('/api/products', async (req, res) => {
  try {
    const { status = 'approved', merchant_id } = req.query;
    
    let query = 'SELECT * FROM products WHERE status = ?';
    let params = [status];
    
    if (merchant_id) {
      query += ' AND merchant_id = ?';
      params.push(merchant_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: { products: rows }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

// 获取产品详情
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    // 获取价格日历
    const [schedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? ORDER BY travel_date',
      [id]
    );
    
    const product = rows[0];
    product.schedules = schedules;
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

// 创建产品
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以创建产品' });
    }

    const {
      title_zh,
      title_th,
      description_zh,
      description_th,
      base_price,
      poster_image,
      poster_filename,
      pdf_file,
      pdf_filename
    } = req.body;

    const productId = uuidv4();

    await pool.execute(
      `INSERT INTO products (id, merchant_id, title_zh, title_th, description_zh, description_th, 
       base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, req.user.id, title_zh, title_th, description_zh, description_th, 
       base_price, poster_image, poster_filename, pdf_file, pdf_filename, 'pending']
    );

    res.json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '创建产品失败' });
  }
});

// 批量设置价格日历
app.post('/api/products/:id/schedules/batch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    // 验证产品归属
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限' });
    }

    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const scheduleId = uuidv4();
      await pool.execute(
        `INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE price = VALUES(price), total_stock = VALUES(total_stock), available_stock = VALUES(available_stock)`,
        [scheduleId, id, schedule.date, schedule.price, schedule.stock, schedule.stock]
      );
    }

    res.json({
      success: true,
      message: '价格日历设置成功'
    });
  } catch (error) {
    console.error('设置价格日历错误:', error);
    res.status(500).json({ success: false, message: '设置价格日历失败' });
  }
});

// ==================== 订单路由 ====================

// 创建订单
app.post('/api/orders', async (req, res) => {
  try {
    const {
      product_id,
      travel_date,
      adults,
      children_no_bed,
      children_with_bed,
      infants,
      customer_name,
      customer_phone,
      customer_email,
      notes
    } = req.body;

    // 获取产品信息
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ? AND status = ?', [product_id, 'approved']);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或未上架' });
    }

    const product = productRows[0];

    // 获取价格日历
    const [scheduleRows] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND travel_date = ?',
      [product_id, travel_date]
    );

    if (scheduleRows.length === 0) {
      return res.status(400).json({ success: false, message: '该日期暂未开放预订' });
    }

    const schedule = scheduleRows[0];
    const total_people = adults + children_no_bed + children_with_bed + infants;

    // 检查库存
    if (schedule.available_stock < total_people) {
      return res.status(400).json({ success: false, message: '库存不足' });
    }

    // 计算价格
    const unit_price = schedule.price;
    const total_price = unit_price * (adults + children_no_bed + children_with_bed);

    // 生成订单号
    const order_number = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    const orderId = uuidv4();

    // 创建订单
    await pool.execute(
      `INSERT INTO orders (id, order_number, product_id, merchant_id, product_title, travel_date, 
       adults, children_no_bed, children_with_bed, infants, total_people, customer_name, 
       customer_phone, customer_email, unit_price, total_price, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, order_number, product_id, product.merchant_id, product.title_zh, travel_date,
       adults, children_no_bed, children_with_bed, infants, total_people, customer_name,
       customer_phone, customer_email, unit_price, total_price, notes, 'pending']
    );

    // 减少库存
    await pool.execute(
      'UPDATE price_schedules SET available_stock = available_stock - ? WHERE product_id = ? AND travel_date = ?',
      [total_people, product_id, travel_date]
    );

    res.json({
      success: true,
      message: '订单创建成功',
      data: { orderId, order_number }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

// 获取订单列表
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    let params = [];
    
    // 根据用户角色过滤
    if (req.user.role === 'merchant') {
      query += ' AND merchant_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'agent') {
      query += ' AND agent_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'customer') {
      query += ' AND customer_id = ?';
      params.push(req.user.id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: { orders: rows }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

// 更新订单状态
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    // 验证权限
    const [orderRows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = orderRows[0];

    if (req.user.role === 'merchant' && order.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此订单' });
    }

    // 更新订单状态
    await pool.execute(
      'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, rejection_reason || null, id]
    );

    res.json({
      success: true,
      message: '订单状态更新成功'
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ success: false, message: '更新订单状态失败' });
  }
});

// ==================== 管理员路由 ====================

// 审核产品
app.put('/api/admin/products/:id/review', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核产品' });
    }

    const { id } = req.params;
    const { status } = req.body;

    await pool.execute(
      'UPDATE products SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: `产品${status === 'approved' ? '审核通过' : '审核拒绝'}`
    });
  } catch (error) {
    console.error('审核产品错误:', error);
    res.status(500).json({ success: false, message: '审核产品失败' });
  }
});

// 审核用户
app.put('/api/admin/users/:id/review', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核用户' });
    }

    const { id } = req.params;
    const { status } = req.body;

    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: `用户${status === 'approved' ? '审核通过' : '审核拒绝'}`
    });
  } catch (error) {
    console.error('审核用户错误:', error);
    res.status(500).json({ success: false, message: '审核用户失败' });
  }
});

// 获取待审核内容
app.get('/api/admin/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看待审核内容' });
    }

    // 获取待审核用户
    const [pendingUsers] = await pool.execute(
      'SELECT id, username, email, role, company_name, contact_person, created_at FROM users WHERE status = ?',
      ['pending']
    );

    // 获取待审核产品
    const [pendingProducts] = await pool.execute(
      `SELECT p.*, u.username as merchant_name 
       FROM products p 
       JOIN users u ON p.merchant_id = u.id 
       WHERE p.status = ?`,
      ['pending']
    );

    res.json({
      success: true,
      data: {
        pendingUsers,
        pendingProducts
      }
    });
  } catch (error) {
    console.error('获取待审核内容错误:', error);
    res.status(500).json({ success: false, message: '获取待审核内容失败' });
  }
});

// ==================== 启动服务器 ====================

async function startServer() {
  try {
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 TTKH旅游管理系统后端服务器启动成功！`);
      console.log(`📍 服务器地址: http://localhost:${PORT}`);
      console.log(`💾 数据库: MySQL (${dbConfig.database})`);
      console.log(`🎯 准备就绪，等待前端连接...`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🔄 正在关闭服务器...');
  if (pool) {
    await pool.end();
    console.log('✅ 数据库连接已关闭');
  }
  process.exit(0);
});

startServer();