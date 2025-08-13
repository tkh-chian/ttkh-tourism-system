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
    console.error('❌ 订单创建错误详情:', error);
    console.error('错误堆栈:', error.stack);
    console.error('请求体:', JSON.stringify(req.body, null, 2));
    
    // 返回更详细的错误信息
    const errorMessage = error.message || '订单创建失败';
    const statusCode = error.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    // 验证密码 - 优先使用password_hash，如果不存在则使用password
    const passwordToCheck = user.password_hash || user.password;
    if (!passwordToCheck) {
      return res.status(400).json({ success: false, message: '用户密码未设置' });
    }
    
    const isValidPassword = await bcrypt.compare(password, passwordToCheck);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '用户名/邮箱或密码错误' });
    }

    // 检查账户状态
    if (user.status !== 'active' && user.status !== 'approved') {
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

// 获取产品列表 - 修复响应格式
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
    
    // 确保返回正确的数据结构
    res.json({
      success: true,
      data: rows  // 直接返回产品数组，而不是 { products: rows }
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

// 获取商家的产品列表
app.get('/api/products/merchant/my-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以查看自己的产品' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE merchant_id = ?';
    let params = [req.user.id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
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
  console.log('📥 收到订单创建请求:', JSON.stringify(req.body, null, 2));
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  console.log('📥 收到订单创建请求:', JSON.stringify(req.body, null, 2));
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

    // 获取价格日历 - 修复时区日期匹配问题
    const [scheduleRows] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND DATE(travel_date) = DATE(?)',
      [product_id, travel_date]
    );

    if (scheduleRows.length === 0) {
      // 获取该产品的所有可用日期，提供更有用的错误信息
      const [availableDates] = await pool.execute(
        'SELECT DATE(travel_date) as available_date FROM price_schedules WHERE product_id = ? AND available_stock > 0 ORDER BY travel_date LIMIT 5',
        [product_id]
      );
      
      const availableDatesStr = availableDates.map(d => d.available_date.toISOString().split('T')[0]).join(', ');
      
      return res.status(400).json({ 
        success: false, 
        message: `该日期暂未开放预订。可选日期: ${availableDatesStr || '暂无可用日期'}`,
        availableDates: availableDates.map(d => d.available_date.toISOString().split('T')[0])
      });
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

    // 处理客户ID - 查找或创建客户用户
    let customer_id = null;
    if (customer_email) {
      // 查找现有客户用户
      const [existingCustomers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND role = ?',
        [customer_email, 'customer']
      );

      if (existingCustomers.length > 0) {
        customer_id = existingCustomers[0].id;
      } else {
        // 创建新的客户用户
        const bcrypt = require('bcryptjs');
        customer_id = uuidv4();
        const defaultPassword = 'customer123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        try {
          await pool.execute(
            `INSERT INTO users (id, username, email, password, password_hash, role, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              customer_id,
              customer_name || customer_email.split('@')[0],
              customer_email,
              hashedPassword,
              hashedPassword,
              'customer',
              'active'
            ]
          );
        } catch (createError) {
          console.log('创建客户用户失败，继续创建订单:', createError.message);
          customer_id = null; // 如果创建失败，设为null
        }
      }
    }

    // 创建订单 - 包含customer_id
    await pool.execute(
      `INSERT INTO orders (id, order_number, product_id, merchant_id, customer_id, product_title, travel_date, 
       adults, children_no_bed, children_with_bed, infants, total_people, customer_name, 
       customer_phone, customer_email, unit_price, total_price, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, order_number, product_id, product.merchant_id, customer_id, product.title_zh || '', travel_date,
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
      data: { orderId, order_number, customer_id }
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

// 获取待审核商家列表
app.get('/api/admin/merchants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看商家列表' });
    }

    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM users WHERE role = ?';
    let params = ['merchant'];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await pool.execute(query, params);
    
    // 移除密码字段
    const merchants = rows.map(merchant => {
      const { password, ...safeData } = merchant;
      return safeData;
    });
    
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
        merchants,
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

// 审核商家状态
app.put('/api/admin/merchants/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核商家' });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    // 验证状态值
    const validStatuses = ['active', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    // 更新商家状态
    await pool.execute(
      'UPDATE users SET status = ?, rejection_reason = ? WHERE id = ? AND role = ?',
      [status, rejection_reason || null, id, 'merchant']
    );

    res.json({
      success: true,
      message: status === 'active' ? '商家审核通过' : status === 'rejected' ? '商家审核拒绝' : '商家已暂停'
    });
  } catch (error) {
    console.error('审核商家状态错误:', error);
    res.status(500).json({ success: false, message: '审核商家状态失败' });
  }
});

// 获取管理员产品列表
app.get('/api/admin/products', authenticateToken, async (req, res) => {
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
    
    query += ` ORDER BY p.createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
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

// 审核产品状态
app.put('/api/admin/products/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核产品' });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    // 验证状态值
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    // 更新产品状态
    await pool.execute(
      'UPDATE products SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, rejection_reason || null, id]
    );

    res.json({
      success: true,
      message: status === 'approved' ? '产品审核通过' : '产品审核拒绝'
    });
  } catch (error) {
    console.error('审核产品状态错误:', error);
    res.status(500).json({ success: false, message: '审核产品状态失败' });
  }
});

// ==================== 启动服务器 ====================

async function startServer() {
  try {
    await initDB();
    
    
// 客户订单列表API - 确保只返回当前客户的订单
app.get('/api/customer/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await connection.execute(`
      SELECT * FROM orders WHERE customer_id = ?
    `, [req.user.id]);
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 商家订单列表API - 确保只返回当前商家的产品订单
app.get('/api/merchant/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await connection.execute(`
      SELECT o.* 
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE p.merchant_id = ?
    `, [req.user.id]);
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching merchant orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
      console.log(`🚀 TTKH旅游管理系统后端服务器启动成功！`);
      console.log(`📍 服务器地址: http://localhost:${PORT}`);
      console.log(`🎯 准备就绪，等待前端连接...`);
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