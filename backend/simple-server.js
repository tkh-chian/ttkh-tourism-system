const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'ttkh-secret-key-2025';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
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
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ 数据库连接池创建成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
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

// ==================== 健康检查路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TTKH旅游系统后端服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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
    const { username, email, password } = req.body;

    // 支持用户名或邮箱登录
    const loginField = username || email;
    if (!loginField || !password) {
      return res.status(400).json({ success: false, message: '请提供登录凭据' });
    }

    // 查找用户 - 支持用户名或邮箱
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?', 
      [loginField, loginField]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: '用户名/邮箱或密码错误' });
    }

    const user = rows[0];

    // 验证密码
    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: '用户密码未设置' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '用户名/邮箱或密码错误' });
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

// 用户登出
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，这里可以将token加入黑名单
    // 目前只是简单返回成功响应
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
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

// 获取公开产品列表（客户浏览）
app.get('/api/products/public', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM products WHERE status = ?';
    let params = ['approved'];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (title_zh LIKE ? OR title_th LIKE ? OR description_zh LIKE ? OR description_th LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE status = ?';
    let countParams = ['approved'];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    
    if (search) {
      countQuery += ' AND (title_zh LIKE ? OR title_th LIKE ? OR description_zh LIKE ? OR description_th LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取公开产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

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
    
    query += ' ORDER BY id DESC'; // 使用id字段替代created_at进行排序
    
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

// 获取商家自己的产品列表
app.get('/api/products/merchant/my-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有商家可以查看自己的产品' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE merchant_id = ?';
    let params = [req.user.id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE merchant_id = ?';
    let countParams = [req.user.id];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家产品列表错误:', error);
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
    // 生成产品编号：PRD-时间戳格式
    const product_number = 'PRD-' + Date.now();

    await pool.execute(
      `INSERT INTO products (id, product_number, merchant_id, title_zh, title_th, description_zh, description_th, base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, product_number, req.user.id, title_zh || '', title_th || '', description_zh || null, 
       description_th || null, base_price || 0, poster_image || null, poster_filename || null,
       pdf_file || null, pdf_filename || null, 'pending']
    );

    res.json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId, product_number }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '创建产品失败', error: error.message });
  }
});

// 获取产品价格日历
app.get('/api/products/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证产品是否存在
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    // 获取价格日历
    const [schedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? ORDER BY travel_date',
      [id]
    );
    
    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    console.error('获取产品价格日历错误:', error);
    res.status(500).json({ success: false, message: '获取产品价格日历失败' });
  }
});

// 批量设置价格日历
app.post('/api/products/:id/schedules/batch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body; // [{ date, price, stock }]

    // 验证产品归属
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限' });
    }

    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const scheduleId = uuidv4();
      
      // 先检查是否存在
      const [existing] = await pool.execute(
        'SELECT id FROM price_schedules WHERE product_id = ? AND travel_date = ?',
        [id, schedule.date]
      );
      
      if (existing.length > 0) {
        // 更新现有记录
        await pool.execute(
          'UPDATE price_schedules SET price = ?, total_stock = ?, available_stock = ? WHERE product_id = ? AND travel_date = ?',
          [schedule.price, schedule.stock, schedule.stock, id, schedule.date]
        );
      } else {
        // 插入新记录
        await pool.execute(
          'INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) VALUES (?, ?, ?, ?, ?, ?)',
          [scheduleId, id, schedule.date, schedule.price, schedule.stock, schedule.stock]
        );
      }
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
    const total_price = unit_price * (adults + children_no_bed + children_with_bed); // 婴儿不计费

    // 生成订单号：ORD-时间戳格式
    const order_number = 'ORD-' + Date.now();
    const orderId = uuidv4();

    // 创建订单
    await pool.execute(
      `INSERT INTO orders (id, order_number, product_id, merchant_id, product_title, travel_date, 
       adults, children_no_bed, children_with_bed, infants, total_people, customer_name, 
       customer_phone, customer_email, unit_price, total_price, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, order_number, product_id, product.merchant_id, product.title_zh || '', travel_date,
       adults || 0, children_no_bed || 0, children_with_bed || 0, infants || 0, total_people, customer_name || '',
       customer_phone || '', customer_email || '', unit_price, total_price, notes || null, 'pending']
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
    const { status, role } = req.query;
    
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
    
    query += ' ORDER BY id DESC';
    
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

// 获取管理员用户列表
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看用户列表' });
    }

    const { status, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, role, company_name, contact_person, phone, status, id FROM users WHERE 1=1';
    let params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员用户列表错误:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 获取管理员产品列表
app.get('/api/admin/products', authenticateToken, async (req, res) => {
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'ttkh-secret-key-2025';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
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
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ 数据库连接池创建成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
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

// ==================== 健康检查路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TTKH旅游系统后端服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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
    const { username, email, password } = req.body;

    // 支持用户名或邮箱登录
    const loginField = username || email;
    if (!loginField || !password) {
      return res.status(400).json({ success: false, message: '请提供登录凭据' });
    }

    // 查找用户 - 支持用户名或邮箱
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?', 
      [loginField, loginField]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: '用户名/邮箱或密码错误' });
    }

    const user = rows[0];

    // 验证密码
    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: '用户密码未设置' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '用户名/邮箱或密码错误' });
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

// 用户登出
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，这里可以将token加入黑名单
    // 目前只是简单返回成功响应
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
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
    
    query += ' ORDER BY id DESC';
    
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

// 获取商家自己的产品列表
app.get('/api/products/merchant/my-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有商家可以查看自己的产品' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE merchant_id = ?';
    let params = [req.user.id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE merchant_id = ?';
    let countParams = [req.user.id];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家产品列表错误:', error);
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
    // 生成产品编号：PRD-时间戳格式
    const product_number = 'PRD-' + Date.now();

    await pool.execute(
      `INSERT INTO products (id, product_number, merchant_id, title_zh, title_th, description_zh, description_th, base_price, poster_image, poster_filename, pdf_file, pdf_filename, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, product_number, req.user.id, title_zh || '', title_th || '', description_zh || null, 
       description_th || null, base_price || 0, poster_image || null, poster_filename || null,
       pdf_file || null, pdf_filename || null, 'pending']
    );

    res.json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId, product_number }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '创建产品失败', error: error.message });
  }
});

// 获取产品价格日历
app.get('/api/products/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证产品是否存在
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    // 获取价格日历
    const [schedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? ORDER BY travel_date',
      [id]
    );
    
    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    console.error('获取产品价格日历错误:', error);
    res.status(500).json({ success: false, message: '获取产品价格日历失败' });
  }
});

// 批量设置价格日历
app.post('/api/products/:id/schedules/batch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body; // [{ date, price, stock }]

    // 验证产品归属
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限' });
    }

    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const scheduleId = uuidv4();
      
      // 先检查是否存在
      const [existing] = await pool.execute(
        'SELECT id FROM price_schedules WHERE product_id = ? AND travel_date = ?',
        [id, schedule.date]
      );
      
      if (existing.length > 0) {
        // 更新现有记录
        await pool.execute(
          'UPDATE price_schedules SET price = ?, total_stock = ?, available_stock = ? WHERE product_id = ? AND travel_date = ?',
          [schedule.price, schedule.stock, schedule.stock, id, schedule.date]
        );
      } else {
        // 插入新记录
        await pool.execute(
          'INSERT INTO price_schedules (id, product_id, travel_date, price, total_stock, available_stock) VALUES (?, ?, ?, ?, ?, ?)',
          [scheduleId, id, schedule.date, schedule.price, schedule.stock, schedule.stock]
        );
      }
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
    const total_price = unit_price * (adults + children_no_bed + children_with_bed); // 婴儿不计费

    // 生成订单号：ORD-时间戳格式
    const order_number = 'ORD-' + Date.now();
    const orderId = uuidv4();

    // 创建订单
    await pool.execute(
      `INSERT INTO orders (id, order_number, product_id, merchant_id, product_title, travel_date, 
       adults, children_no_bed, children_with_bed, infants, total_people, customer_name, 
       customer_phone, customer_email, unit_price, total_price, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, order_number, product_id, product.merchant_id, product.title_zh || '', travel_date,
       adults || 0, children_no_bed || 0, children_with_bed || 0, infants || 0, total_people, customer_name || '',
       customer_phone || '', customer_email || '', unit_price, total_price, notes || null, 'pending']
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
    const { status, role } = req.query;
    
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
    
    query += ' ORDER BY id DESC';
    
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

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看所有产品' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as merchant_name, u.company_name 
      FROM products p 
      JOIN users u ON p.merchant_id = u.id 
      WHERE 1=1
    `;
    let params = [];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY p.id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    let countParams = [];
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

// 审核产品
app.put('/api/admin/products/:id/review', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核产品' });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

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

// 更新产品状态
app.put('/api/admin/products/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以更新产品状态' });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: '请提供产品状态' });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的产品状态' });
    }

    // 检查产品是否存在
    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    // 更新产品状态
    await pool.execute(
      'UPDATE products SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, status === 'rejected' ? reason : null, id]
    );

    // 获取更新后的产品信息
    const [updatedRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '产品状态更新成功',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('更新产品状态错误:', error);
    res.status(500).json({ success: false, message: '更新产品状态失败' });
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

// 更新用户状态 - 支持PUT和PATCH方法
app.put('/api/admin/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以更新用户状态' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: '请提供用户状态' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的用户状态' });
    }

    // 检查用户是否存在
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = userRows[0];

    // 不能修改管理员状态
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: '不能修改管理员状态' });
    }

    // 更新用户状态
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    // 获取更新后的用户信息
    const [updatedRows] = await pool.execute('SELECT id, username, email, role, status FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ success: false, message: '更新用户状态失败' });
  }
});

// 更新用户状态 - PATCH方法支持
app.patch('/api/admin/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以更新用户状态' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: '请提供用户状态' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的用户状态' });
    }

    // 检查用户是否存在
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = userRows[0];

    // 不能修改管理员状态
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: '不能修改管理员状态' });
    }

    // 更新用户状态
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    // 获取更新后的用户信息
    const [updatedRows] = await pool.execute('SELECT id, username, email, role, status FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ success: false, message: '更新用户状态失败' });
  }
});

// 获取商家管理列表
app.get('/api/admin/merchants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看商家列表' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, role, company_name, contact_person, phone, status, id FROM users WHERE role = ?';
    let params = ['merchant'];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = ?';
    let countParams = ['merchant'];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;
    
    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家列表错误:', error);
    res.status(500).json({ success: false, message: '获取商家列表失败' });
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
      'SELECT id, username, email, role, company_name, contact_person, id FROM users WHERE status = ?',
      ['pending']
    );

    // 获取待审核产品
    const [pendingProducts] = await pool.execute(
      'SELECT p.*, u.username as merchant_name FROM products p JOIN users u ON p.merchant_id = u.id WHERE p.status = ?',
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
      console.log(`📋 API文档:`);
      console.log(`   POST /api/auth/register - 用户注册`);
      console.log(`   POST /api/auth/login - 用户登录`);
      console.log(`   GET  /api/auth/profile - 获取用户信息`);
      console.log(`   GET  /api/products - 获取产品列表`);
      console.log(`   POST /api/products - 创建产品`);
      console.log(`   POST /api/orders - 创建订单`);
      console.log(`   GET  /api/orders - 获取订单列表`);
      console.log(`   PUT  /api/admin/products/:id/review - 审核产品`);
      console.log(`   PUT  /api/admin/users/:id/review - 审核用户`);
      console.log(`\n🎯 准备就绪，等待前端连接...`);
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

// 启动服务器
startServer();
