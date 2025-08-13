const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'ttkh-tourism-secret-key-2024';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism',
  charset: 'utf8mb4'
};

// 中间件配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 数据库连接池
let pool;
async function initDatabase() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ 数据库连接池初始化成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 角色验证中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

// 生成唯一编号
function generateProductNumber() {
  const timestamp = Date.now();
  return `PRD-${timestamp}`;
}

function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// 文件转换为Base64
function fileToBase64(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// ==================== API路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TTKH旅游系统后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('注册请求数据:', req.body);
    const { username, email, password, role, company_name, contact_person, phone } = req.body;
    
    // 验证必填字段 - 移除username必填要求
    if (!email || !password || !role) {
      console.log('❌ 必填字段验证失败');
      return res.status(400).json({ 
        error: '邮箱、密码和角色为必填项',
        received: { email: !!email, password: !!password, role: !!role }
      });
    }
    
    // 验证商家必填字段
    if (role === 'merchant' && (!company_name || !contact_person)) {
      console.log('❌ 商家必填字段验证失败');
      return res.status(400).json({ 
        error: '商家注册需要填写公司名称和联系人',
        received: { company_name: !!company_name, contact_person: !!contact_person }
      });
    }
    
    // 检查邮箱是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      console.log('❌ 邮箱已存在:', email);
      return res.status(400).json({ error: '邮箱已被注册' });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    // 如果没有提供username，使用email的用户名部分作为默认值
    const finalUsername = username || email.split('@')[0];
    
    console.log('准备插入用户数据:', {
      userId, username: finalUsername, email, role, company_name, contact_person, phone
    });
    
    // 插入新用户 - 确保字段匹配
    const insertResult = await pool.execute(
      `INSERT INTO users (id, username, email, password_hash, role, company_name, contact_person, phone, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        userId, 
        finalUsername, 
        email, 
        passwordHash, 
        role, 
        company_name || null, 
        contact_person || null, 
        phone || null
      ]
    );
    
    console.log('✅ 用户注册成功:', { 
      userId, username: finalUsername, email, role,
      insertId: insertResult[0].insertId,
      affectedRows: insertResult[0].affectedRows
    });
    
    res.status(201).json({ 
      message: '注册成功，等待管理员审核',
      userId: userId,
      username: finalUsername,
      email: email,
      role: role
    });
  } catch (error) {
    console.error('❌ 注册失败详细错误:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    // 根据错误类型返回具体信息
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: '邮箱已被注册' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ error: '数据库字段错误', details: error.sqlMessage });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: '数据库表不存在', details: error.sqlMessage });
    }
    
    res.status(500).json({ 
      error: '注册失败',
      details: error.message,
      code: error.code
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('登录请求数据:', req.body);
    const { email, password, username } = req.body;
    
    // 验证必填字段
    if (!password) {
      console.log('❌ 密码缺失');
      return res.status(400).json({ error: '密码不能为空' });
    }
    
    // 支持用户名或邮箱登录 - 修复undefined问题
    const loginField = email || username;
    if (!loginField) {
      console.log('❌ 登录字段缺失');
      return res.status(400).json({ error: '请输入用户名或邮箱' });
    }
    
    console.log('查找用户:', { loginField, email, username });
    
    // 查找用户 - 修复SQL参数问题
    let query, params;
    if (email) {
      // 如果提供了email，优先用email查找
      query = 'SELECT * FROM users WHERE email = ?';
      params = [email];
    } else if (username) {
      // 如果只提供了username，用username查找
      query = 'SELECT * FROM users WHERE username = ?';
      params = [username];
    } else {
      // 兼容性：用loginField同时匹配email和username
      query = 'SELECT * FROM users WHERE email = ? OR username = ?';
      params = [loginField, loginField];
    }
    
    console.log('执行SQL查询:', { query, params });
    
    const [users] = await pool.execute(query, params);
    
    console.log('查找到用户数量:', users.length);
    
    if (users.length === 0) {
      console.log('❌ 用户不存在');
      return res.status(401).json({ error: '用户名/邮箱或密码错误' });
    }
    
    const user = users[0];
    console.log('找到用户:', { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      status: user.status 
    });
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ 密码验证失败');
      return res.status(401).json({ error: '用户名/邮箱或密码错误' });
    }
    
    console.log('✅ 密码验证成功');
    
    // 检查用户状态
    if (user.status !== 'approved') {
      console.log('❌ 用户状态未通过审核:', user.status);
      return res.status(403).json({ error: '账户未通过审核或已被暂停' });
    }
    
    console.log('✅ 用户状态检查通过');
    
    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ JWT令牌生成成功');
    
    res.json({
      message: '登录成功',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        company_name: user.company_name || null,
        contact_person: user.contact_person || null,
        phone: user.phone || null
      }
    });
    
    console.log('✅ 登录响应发送成功');
  } catch (error) {
    console.error('❌ 登录失败详细错误:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: '登录失败',
      details: error.message 
    });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, company_name, contact_person, phone, status FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 获取用户资料 (profile路由)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, company_name, contact_person, phone, status FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({ error: '获取用户资料失败' });
  }
});

// 管理员API - 获取所有用户
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, company_name, contact_person, phone, status, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 管理员API - 获取所有产品
app.get('/api/admin/products', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name, u.company_name 
      FROM products p 
      JOIN users u ON p.merchant_id = u.id 
      ORDER BY p.created_at DESC
    `);
    
    res.json({ products });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

// 管理员API - 获取所有订单
app.get('/api/admin/orders', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT o.*, p.title_zh as product_title, u.username as merchant_name
      FROM orders o 
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.merchant_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 管理员API - 获取统计数据
app.get('/api/admin/statistics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // 获取用户统计
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'merchant' THEN 1 ELSE 0 END) as total_merchants,
        SUM(CASE WHEN role = 'agent' THEN 1 ELSE 0 END) as total_agents,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as total_customers,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users
      FROM users
    `);
    
    // 获取产品统计
    const [productStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_products,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_products
      FROM products
    `);
    
    // 获取订单统计
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END) as total_revenue
      FROM orders
    `);
    
    res.json({
      users: userStats[0],
      products: productStats[0],
      orders: orderStats[0]
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// ==================== 管理员API ====================

// 获取待审核用户列表
app.get('/api/admin/pending-users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, company_name, contact_person, phone, status, created_at FROM users WHERE status = ? ORDER BY created_at DESC',
      ['pending']
    );
    
    res.json({ users });
  } catch (error) {
    console.error('获取待审核用户失败:', error);
    res.status(500).json({ error: '获取待审核用户失败' });
  }
});

// 审核用户
app.post('/api/admin/approve-user/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'approve' 或 'reject'
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [newStatus, userId]
    );
    
    res.json({ message: `用户${action === 'approve' ? '审核通过' : '审核拒绝'}` });
  } catch (error) {
    console.error('审核用户失败:', error);
    res.status(500).json({ error: '审核用户失败' });
  }
});

// 获取所有商家 - 修复数据格式以匹配前端期望
app.get('/api/admin/merchants', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [merchants] = await pool.execute(
      'SELECT id, username, email, company_name, contact_person, phone, status, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
      ['merchant']
    );
    
    // 返回前端期望的数据格式：{success: true, data: {users: [...]}}
    res.json({ 
      success: true, 
      data: { 
        users: merchants 
      } 
    });
  } catch (error) {
    console.error('获取商家列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取商家列表失败' 
    });
  }
});

// 获取待审核产品
app.get('/api/admin/pending-products', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name, u.company_name 
      FROM products p 
      JOIN users u ON p.merchant_id = u.id 
      WHERE p.status = 'pending' 
      ORDER BY p.created_at DESC
    `);
    
    res.json({ products });
  } catch (error) {
    console.error('获取待审核产品失败:', error);
    res.status(500).json({ error: '获取待审核产品失败' });
  }
});

// 审核产品
app.post('/api/admin/approve-product/:productId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { productId } = req.params;
    const { action } = req.body; // 'approve' 或 'reject'
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await pool.execute(
      'UPDATE products SET status = ? WHERE id = ?',
      [newStatus, productId]
    );
    
    res.json({ message: `产品${action === 'approve' ? '审核通过' : '审核拒绝'}` });
  } catch (error) {
    console.error('审核产品失败:', error);
    res.status(500).json({ error: '审核产品失败' });
  }
});

// ==================== 商家API ====================

// 创建产品
app.post('/api/products', authenticateToken, requireRole(['merchant']), upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title_zh, title_th, description_zh, description_th, base_price } = req.body;
    const productId = uuidv4();
    const productNumber = generateProductNumber();
    
    let posterImage = null, posterFilename = null;
    let pdfFile = null, pdfFilename = null;
    
    // 处理海报图片
    if (req.files && req.files.poster && req.files.poster[0]) {
      const poster = req.files.poster[0];
      posterImage = fileToBase64(poster);
      posterFilename = poster.originalname;
    }
    
    // 处理PDF文件
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      const pdf = req.files.pdf[0];
      pdfFile = fileToBase64(pdf);
      pdfFilename = pdf.originalname;
    }
    
    // 插入产品
    await pool.execute(`
      INSERT INTO products (id, product_number, merchant_id, title_zh, title_th, description_zh, description_th, base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [productId, productNumber, req.user.userId, title_zh, title_th || null, description_zh || null, description_th || null, base_price || 0, posterImage, posterFilename, pdfFile, pdfFilename]);
    
    res.status(201).json({ 
      message: '产品创建成功，等待管理员审核',
      productId: productId,
      productNumber: productNumber
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({ error: '创建产品失败' });
  }
});

// 获取商家的产品列表
app.get('/api/merchant/products', authenticateToken, requireRole(['merchant']), async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE merchant_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    
    res.json({ products });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

// 设置产品价格日历
app.post('/api/products/:productId/schedules', authenticateToken, requireRole(['merchant']), async (req, res) => {
  try {
    const { productId } = req.params;
    const { schedules } = req.body; // [{ travel_date, price, total_stock }]
    
    // 验证产品所有权
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND merchant_id = ?',
      [productId, req.user.userId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在或无权限' });
    }
    
    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const scheduleId = uuidv4();
      await pool.execute(`
        INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) 
        VALUES (?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        price = VALUES(price), 
        total_stock = VALUES(total_stock), 
        available_stock = VALUES(available_stock)
      `, [scheduleId, productId, schedule.travel_date, schedule.price, schedule.total_stock, schedule.total_stock]);
    }
    
    res.json({ message: '价格日历设置成功' });
  } catch (error) {
    console.error('设置价格日历失败:', error);
    res.status(500).json({ error: '设置价格日历失败' });
  }
});

// 获取商家的订单列表
app.get('/api/merchant/orders', authenticateToken, requireRole(['merchant']), async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE merchant_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    
    res.json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 更新订单状态
app.put('/api/merchant/orders/:orderId', authenticateToken, requireRole(['merchant']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, rejection_reason } = req.body;
    
    // 验证订单所有权
    const [orders] = await pool.execute(
      'SELECT id FROM orders WHERE id = ? AND merchant_id = ?',
      [orderId, req.user.userId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ error: '订单不存在或无权限' });
    }
    
    // 更新订单状态
    await pool.execute(
      'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, rejection_reason || null, orderId]
    );
    
    res.json({ message: '订单状态更新成功' });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

// ==================== 公共API ====================

// 获取已审核通过的产品列表（首页展示）
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name, u.company_name 
      FROM products p 
      JOIN users u ON p.merchant_id = u.id 
      WHERE p.status = 'approved' 
      ORDER BY p.created_at DESC
    `);
    
    res.json({ products });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

// 获取产品详情
app.get('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name, u.company_name 
      FROM products p 
      JOIN users u ON p.merchant_id = u.id 
      WHERE p.id = ? AND p.status = 'approved'
    `, [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    // 获取价格日历
    const [schedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? ORDER BY travel_date ASC',
      [productId]
    );
    
    res.json({ 
      product: products[0],
      schedules: schedules
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({ error: '获取产品详情失败' });
  }
});

// 创建订单
app.post('/api/orders', authenticateToken, upload.single('scan_document'), async (req, res) => {
  try {
    const { 
      product_id, travel_date, adults, children_no_bed, children_with_bed, infants,
      customer_name, customer_phone, customer_email, notes 
    } = req.body;
    
    // 获取产品信息
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND status = ?',
      [product_id, 'approved']
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    const product = products[0];
    
    // 获取价格信息
    const [schedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND travel_date = ?',
      [product_id, travel_date]
    );
    
    if (schedules.length === 0) {
      return res.status(400).json({ error: '选择的日期不可预订' });
    }
    
    const schedule = schedules[0];
    const totalPeople = parseInt(adults || 0) + parseInt(children_no_bed || 0) + parseInt(children_with_bed || 0) + parseInt(infants || 0);
    
    // 检查库存
    if (schedule.available_stock < totalPeople) {
      return res.status(400).json({ error: '库存不足' });
    }
    
    // 处理扫描件
    let scanDocument = null, scanFilename = null;
    if (req.file) {
      scanDocument = fileToBase64(req.file);
      scanFilename = req.file.originalname;
    }
    
    // 创建订单
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();
    const totalPrice = schedule.price * totalPeople;
    
    await pool.execute(`
      INSERT INTO orders (
        id, order_number, product_id, merchant_id, agent_id, customer_id,
        product_title, travel_date, adults, children_no_bed, children_with_bed, infants, total_people,
        customer_name, customer_phone, customer_email, unit_price, total_price,
        payment_status, status, notes, scan_document, scan_filename
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, orderNumber, product_id, product.merchant_id, 
      req.user.role === 'agent' ? req.user.userId : null,
      req.user.role === 'customer' ? req.user.userId : null,
      product.title_zh, travel_date, adults || 0, children_no_bed || 0, children_with_bed || 0, infants || 0, totalPeople,
      customer_name, customer_phone, customer_email, schedule.price, totalPrice,
      'pending', 'pending', notes, scanDocument, scanFilename
    ]);
    
    // 更新库存
    await pool.execute(
      'UPDATE price_schedules SET available_stock = available_stock - ? WHERE id = ?',
      [totalPeople, schedule.id]
    );
    
    res.status(201).json({ 
      message: '订单创建成功',
      orderId: orderId,
      orderNumber: orderNumber,
      totalPrice: totalPrice
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 获取用户订单列表
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let query, params;
    
    if (req.user.role === 'agent') {
      query = 'SELECT * FROM orders WHERE agent_id = ? ORDER BY created_at DESC';
      params = [req.user.userId];
    } else if (req.user.role === 'customer') {
      query = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC';
      params = [req.user.userId];
    } else {
      return res.status(403).json({ error: '权限不足' });
    }
    
    const [orders] = await pool.execute(query, params);
    res.json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// ==================== 启动服务器 ====================

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 TTKH旅游系统后端服务启动成功`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log('==========================================');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  if (pool) {
    await pool.end();
    console.log('✅ 数据库连接已关闭');
  }
  process.exit(0);
});

startServer();