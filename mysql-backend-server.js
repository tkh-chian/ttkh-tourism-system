const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'ttkh-secret-key-2025';

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

// 创建连接池
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 从数据库获取用户信息
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '无效的访问令牌' });
  }
};

// 基础路由
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: '服务器运行正常' });
});

// 登录路由
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('登录请求:', req.body);
    const { username, password, email } = req.body;
    
    const loginEmail = email || username;
    
    if (!loginEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名/邮箱和密码为必填项' 
      });
    }

    // 从数据库查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [loginEmail, loginEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: { user: safeUser, token }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取用户信息
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { password_hash, ...safeUser } = req.user;
    
    res.json({
      success: true,
      data: { user: safeUser }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 用户登出
app.post('/api/auth/logout', (req, res) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ success: false, message: '登出失败' });
  }
});

// 获取产品列表
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: { products }
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
    
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    // 更新浏览次数
    await pool.execute('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: { product: products[0] }
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

// 获取产品详情 - 兼容查询参数
app.get('/api/product-detail', async (req, res) => {
  try {
    const { id } = req.query;
    
    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    res.json({
      success: true,
      data: { product: products[0] }
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

    console.log('创建产品请求数据:', req.body);

    const {
      title_zh, title_th, description_zh, description_th,
      base_price, category_id, poster_image, poster_filename,
      pdf_file, pdf_filename
    } = req.body;

    // 验证必填字段
    if (!title_zh || !description_zh || !base_price) {
      return res.status(400).json({ 
        success: false, 
        message: '产品标题、描述和价格为必填项' 
      });
    }

    // 处理可能为undefined的值，转换为null
    const [result] = await pool.execute(`
      INSERT INTO products (
        merchant_id, title_zh, title_th, 
        description_zh, description_th, base_price,
        poster_image, poster_filename, pdf_file, pdf_filename,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      req.user.id, 
       
      title_zh, 
      title_th || null,
      description_zh, 
      description_th || null, 
      parseFloat(base_price),
      poster_image || null, 
      poster_filename || null, 
      pdf_file || null, 
      pdf_filename || null
    ]);

    res.status(201).json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId: result.insertId }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    console.error('错误详情:', error.message);
    res.status(500).json({ 
      success: false, 
      message: '创建产品失败',
      error: error.message 
    });
  }
});

// 获取商家的产品列表
app.get('/api/products/merchant/my-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以查看自己的产品' });
    }

    const [products] = await pool.execute(`
      SELECT p.*
      FROM products p
      
      WHERE p.merchant_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('获取商家产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取商家产品列表失败' });
  }
});

// 删除产品
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以删除产品' });
    }

    const { id } = req.params;
    
    // 检查产品是否属于当前商家
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限删除' });
    }

    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ success: false, message: '删除产品失败' });
  }
});

// 更新产品
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以更新产品' });
    }

    const { id } = req.params;
    const {
      title_zh, title_th, description_zh, description_th,
      base_price, category_id, poster_image, poster_filename,
      pdf_file, pdf_filename, delete_poster, delete_pdf
    } = req.body;
    
    // 检查产品是否属于当前商家
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限修改' });
    }

    const currentProduct = products[0];
    
    // 检查产品状态：只有pending、rejected、archived状态的产品可以修改
    if (currentProduct.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: '已通过审核的产品必须先下架才能修改' 
      });
    }

    // 处理文件更新逻辑
    let finalPosterImage = currentProduct.poster_image;
    let finalPosterFilename = currentProduct.poster_filename;
    let finalPdfFile = currentProduct.pdf_file;
    let finalPdfFilename = currentProduct.pdf_filename;

    // 处理海报图片
    if (delete_poster === true) {
      finalPosterImage = null;
      finalPosterFilename = null;
    } else if (poster_image) {
      finalPosterImage = poster_image;
      finalPosterFilename = poster_filename || null;
    }

    // 处理PDF文件
    if (delete_pdf === true) {
      finalPdfFile = null;
      finalPdfFilename = null;
    } else if (pdf_file) {
      finalPdfFile = pdf_file;
      finalPdfFilename = pdf_filename || null;
    }

    // 更新产品，如果是archived状态则改为pending重新审核
    const newStatus = currentProduct.status === 'archived' ? 'pending' : currentProduct.status;

    await pool.execute(`
      UPDATE products SET
        title_zh = ?, title_th = ?, description_zh = ?, description_th = ?,
        base_price = ?, poster_image = ?, poster_filename = ?,
        pdf_file = ?, pdf_filename = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title_zh, 
      title_th || null, 
      description_zh, 
      description_th || null,
      parseFloat(base_price), 
       
      finalPosterImage, 
      finalPosterFilename,
      finalPdfFile, 
      finalPdfFilename,
      newStatus,
      id
    ]);

    // 获取更新后的产品信息
    const [updatedProducts] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);

    const message = newStatus === 'pending' && currentProduct.status === 'archived' 
      ? '产品更新成功，已重新提交审核' 
      : '产品更新成功';

    res.json({
      success: true,
      message,
      data: { product: updatedProducts[0] }
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ success: false, message: '更新产品失败' });
  }
});

// 商家更新产品状态（下架/上架）
app.put('/api/products/:id/status', authenticateToken, async (req, res) => {
  try {
    console.log('商家更新产品状态请求:', { 
      productId: req.params.id, 
      status: req.body.status, 
      userId: req.user.id,
      userRole: req.user.role 
    });

    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以更新产品状态' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    // 验证状态值
    const allowedStatuses = ['pending', 'archived'];
    if (!allowedStatuses.includes(status)) {
      console.log('无效的状态值:', status);
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }
    
    // 检查产品是否属于当前商家
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ? AND merchant_id = ?', [id, req.user.id]);
    
    if (products.length === 0) {
      console.log('产品不存在或无权限:', { productId: id, merchantId: req.user.id });
      return res.status(404).json({ success: false, message: '产品不存在或无权限修改' });
    }

    const currentProduct = products[0];
    console.log('当前产品状态:', currentProduct.status, '目标状态:', status);
    
    // 验证状态转换是否合法
    if (status === 'archived' && currentProduct.status !== 'approved') {
      console.log('状态转换不合法: 只有已通过审核的产品才能下架');
      return res.status(400).json({ success: false, message: '只有已通过审核的产品才能下架' });
    }
    
    if (status === 'pending' && currentProduct.status !== 'archived') {
      console.log('状态转换不合法: 只有已下架的产品才能重新申请上架');
      return res.status(400).json({ success: false, message: '只有已下架的产品才能重新申请上架' });
    }

    const [result] = await pool.execute('UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    console.log('更新结果:', result);

    if (result.affectedRows === 0) {
      console.log('更新失败: 没有行被影响');
      return res.status(500).json({ success: false, message: '更新失败，没有行被影响' });
    }

    res.json({
      success: true,
      message: status === 'archived' ? '产品下架成功' : '产品重新提交审核成功'
    });
  } catch (error) {
    console.error('更新产品状态错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ success: false, message: '更新产品状态失败: ' + error.message });
  }
});

// 获取产品的价格日历 - 公开访问
app.get('/api/products/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查产品是否存在
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const [schedules] = await pool.execute(`
      SELECT * FROM price_schedules 
      WHERE product_id = ? 
      ORDER BY travel_date ASC
    `, [id]);

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    console.error('获取价格日历错误:', error);
    res.status(500).json({ success: false, message: '获取价格日历失败' });
  }
});

// 批量设置价格日历
app.post('/api/products/:id/schedules/batch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    // 检查产品是否存在
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (req.user.role === 'merchant' && products[0].merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此产品' });
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 批量插入或更新价格日历
      for (const schedule of schedules) {
        await connection.execute(`
          INSERT INTO price_schedules (product_id, travel_date, price, total_stock, available_stock, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          price = VALUES(price),
          total_stock = VALUES(total_stock),
          available_stock = VALUES(available_stock),
          updated_at = NOW()
        `, [id, schedule.date, schedule.price, schedule.stock, schedule.stock]);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: '价格日历设置成功'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('设置价格日历错误:', error);
    res.status(500).json({ success: false, message: '设置价格日历失败' });
  }
});

// 批量删除价格日历设置
app.delete('/api/products/:id/schedules/batch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { dates } = req.body;

    // 检查产品是否存在
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (req.user.role === 'merchant' && products[0].merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此产品' });
    }

    // 批量删除
    const placeholders = dates.map(() => '?').join(',');
    await pool.execute(`
      DELETE FROM price_schedules 
      WHERE product_id = ? AND travel_date IN (${placeholders})
    `, [id, ...dates]);

    res.json({
      success: true,
      message: '价格设置删除成功'
    });
  } catch (error) {
    console.error('删除价格设置错误:', error);
    res.status(500).json({ success: false, message: '删除价格设置失败' });
  }
});

// 删除单个价格日历设置
app.delete('/api/products/:id/schedules/:date', authenticateToken, async (req, res) => {
  try {
    const { id, date } = req.params;

    // 检查产品是否存在
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (req.user.role === 'merchant' && products[0].merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此产品' });
    }

    const [result] = await pool.execute(`
      DELETE FROM price_schedules 
      WHERE product_id = ? AND travel_date = ?
    `, [id, date]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '价格设置不存在' });
    }

    res.json({
      success: true,
      message: '价格设置删除成功'
    });
  } catch (error) {
    console.error('删除价格设置错误:', error);
    res.status(500).json({ success: false, message: '删除价格设置失败' });
  }
});

// 获取分类列表
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT * FROM categories 
      WHERE status = 'active' 
      ORDER BY sort_order ASC, id ASC
    `);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

// 创建订单
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    console.log('创建订单请求数据:', req.body);
    
    const {
      product_id, travel_date, adults, children_no_bed, children_with_bed, infants,
      total_people, unit_price, total_price, customer_name, customer_phone, 
      customer_email, notes
    } = req.body;

    // 验证必填字段
    if (!product_id || !travel_date || !customer_name || !customer_phone) {
      return res.status(400).json({ 
        success: false, 
        message: '产品ID、出行日期、客户姓名和联系电话为必填项' 
      });
    }

    // 检查产品是否存在
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const product = products[0];

    // 检查价格日历是否存在 - 使用精确匹配和日期转换
    console.log(`🔍 查询价格日历: product_id=${product_id}, travel_date=${travel_date}`);
    
    // 首先获取所有该产品的价格日历，然后在应用层进行日期匹配
    const [allSchedules] = await pool.execute(
      'SELECT * FROM price_schedules WHERE product_id = ?',
      [product_id]
    );
    
    // 在应用层进行日期匹配
    const schedules = allSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.travel_date).toISOString().split('T')[0];
      return scheduleDate === travel_date;
    });
    
    console.log(`📋 找到 ${schedules.length} 条价格记录`);

    if (schedules.length === 0) {
      return res.status(400).json({ success: false, message: '选择的日期没有价格设置' });
    }

    const schedule = schedules[0];
    console.log(`💰 价格信息: ¥${schedule.price}, 库存: ${schedule.available_stock}`);

    // 检查库存是否充足
    if (schedule.available_stock < total_people) {
      return res.status(400).json({ 
        success: false, 
        message: `库存不足，当前可预订人数：${schedule.available_stock}` 
      });
    }

    // 验证价格
    const expectedPrice = parseFloat(schedule.price) * total_people;
    console.log(`🧮 价格验证: 期望=${expectedPrice}, 实际=${total_price}`);
    if (Math.abs(total_price - expectedPrice) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        message: '价格计算错误，请刷新页面重试' 
      });
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 生成订单号
      const orderNumber = 'TT' + Date.now() + Math.floor(Math.random() * 1000);

      // 创建订单 - 准备联系信息JSON
      const contactInfo = {
        name: customer_name,
        phone: customer_phone,
        email: customer_email || null
      };

      // 计算订单金额
      const calculatedTotalAmount = parseFloat(unit_price) * total_people;
      const finalAmount = calculatedTotalAmount; // 暂时不考虑折扣和运费

      // 确定代理ID - 如果当前用户是代理，则设置agent_id为当前用户ID
      const agentId = req.user.role === 'agent' ? req.user.id : null;
      
      // 如果当前用户不是代理，但用户有关联的代理，也要设置agent_id
      let finalAgentId = agentId;
      if (!agentId && req.user.role === 'user') {
        // 检查用户是否有关联的代理
        const [userInfo] = await connection.execute('SELECT agent_id FROM users WHERE id = ?', [req.user.id]);
        if (userInfo.length > 0 && userInfo[0].agent_id) {
          finalAgentId = userInfo[0].agent_id;
        }
      }

      console.log(`🎯 订单代理信息: 用户角色=${req.user.role}, 用户ID=${req.user.id}, 代理ID=${finalAgentId}`);

      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_no, user_id, merchant_id, product_id, travel_date,
          adults, children_no_bed, children_with_bed, infants, total_people,
          unit_price, total_price, total_amount, final_amount, customer_name,
          customer_phone, customer_email, contact_info, notes, agent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, req.user.id, product.merchant_id, product_id, travel_date,
          adults || 0, children_no_bed || 0, children_with_bed || 0, infants || 0, total_people,
          parseFloat(unit_price), parseFloat(total_price), calculatedTotalAmount, finalAmount, customer_name,
          customer_phone, customer_email || null, JSON.stringify(contactInfo), notes || null, finalAgentId
        ]
      );

      // 更新库存 - 使用找到的schedule记录的ID进行精确更新
      const scheduleId = schedule.id;
      const updateResult = await connection.execute(
        'UPDATE price_schedules SET available_stock = available_stock - ? WHERE id = ?',
        [total_people, scheduleId]
      );
      
      console.log(`📦 库存更新: 影响 ${updateResult[0].affectedRows} 条记录`);

      // 更新产品订单数量
      await connection.execute(
        'UPDATE products SET order_count = order_count + 1 WHERE id = ?',
        [product_id]
      );

      await connection.commit();
      connection.release();

      console.log('订单创建成功:', { orderId: orderResult.insertId, orderNumber });

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: { 
          orderId: orderResult.insertId,
          orderNumber: orderNumber
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建订单失败: ' + error.message 
    });
  }
});

// 获取订单列表
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 订单查询请求: 用户ID=${req.user.id}, 角色=${req.user.role}`);
    
    let query = `
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
    `;
    
    let params = [];
    
    if (req.user.role === 'admin') {
      // 管理员可以查看所有订单
      console.log('📋 管理员查看所有订单');
    } else if (req.user.role === 'merchant') {
      // 商家只能查看自己产品的订单
      query += ' WHERE p.merchant_id = ?';
      params.push(req.user.id);
      console.log(`🏪 商家查看自己的订单: merchant_id=${req.user.id}`);
    } else if (req.user.role === 'user') {
      // 用户只能查看自己的订单
      query += ' WHERE o.user_id = ?';
      params.push(req.user.id);
      console.log(`👤 用户查看自己的订单: user_id=${req.user.id}`);
    } else if (req.user.role === 'agent') {
      // 代理可以查看自己推荐的客户的订单
      query += ' WHERE o.agent_id = ?';
      params.push(req.user.id);
      console.log(`🎯 代理查看自己的订单: agent_id=${req.user.id}`);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    console.log(`📝 执行查询: ${query}`);
    console.log(`📊 查询参数:`, params);
    
    const [orders] = await pool.execute(query, params);
    
    console.log(`✅ 查询结果: 找到 ${orders.length} 条订单`);
    if (orders.length > 0) {
      console.log(`📋 订单详情:`, orders.map(o => ({
        id: o.id,
        order_no: o.order_no,
        agent_id: o.agent_id,
        user_id: o.user_id,
        customer_name: o.customer_name
      })));
    }
    
    // 确保返回的数据格式与前端期望的一致
    res.json({
      success: true,
      data: orders,
      message: `找到 ${orders.length} 条订单`
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

// 代理统计数据API
app.get('/api/agent/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const agentId = req.user.id;
    
    // 获取代理的客户总数
    const [customerCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE agent_id = ?',
      [agentId]
    );
    
    // 获取代理的订单总数和总金额
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(commission_amount), 0) as total_commission
      FROM orders 
      WHERE agent_id = ?
    `, [agentId]);
    
    // 获取本月订单数和佣金
    const [monthlyStats] = await pool.execute(`
      SELECT 
        COUNT(*) as monthly_orders,
        COALESCE(SUM(commission_amount), 0) as monthly_commission
      FROM orders 
      WHERE agent_id = ? AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `, [agentId]);
    
    // 获取活跃客户数（最近30天有订单的客户）
    const [activeCustomers] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM orders 
      WHERE agent_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [agentId]);
    
    // 计算转化率（有订单的客户 / 总客户数）
    const [convertedCustomers] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM orders 
      WHERE agent_id = ?
    `, [agentId]);
    
    const totalCustomers = customerCount[0].count;
    const conversionRate = totalCustomers > 0 ? (convertedCustomers[0].count / totalCustomers * 100) : 0;
    
    res.json({
      success: true,
      data: {
        totalCustomers: totalCustomers,
        totalOrders: orderStats[0].total_orders,
        totalCommission: parseFloat(orderStats[0].total_commission || 0),
        monthlyRevenue: parseFloat(orderStats[0].total_revenue || 0),
        monthlyOrders: monthlyStats[0].monthly_orders,
        monthlyCommission: parseFloat(monthlyStats[0].monthly_commission || 0),
        activeCustomers: activeCustomers[0].count,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      }
    });
  } catch (error) {
    console.error('获取代理统计数据失败:', error);
    res.status(500).json({ success: false, message: '获取代理统计数据失败' });
  }
});

// 代理客户管理API
app.get('/api/agent/customers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const agentId = req.user.id;
    
    const [customers] = await pool.execute(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.final_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.agent_id = ?
      GROUP BY u.id, u.username, u.email, u.phone, u.created_at
      ORDER BY u.created_at DESC
    `, [agentId]);
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('获取代理客户列表失败:', error);
    res.status(500).json({ success: false, message: '获取代理客户列表失败' });
  }
});

// 代理佣金报告API
app.get('/api/agent/commission', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const agentId = req.user.id;
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        o.id,
        o.order_no as order_number,
        o.final_amount as total_amount,
        o.commission_amount,
        o.commission_rate,
        o.created_at,
        u.username as customer_name,
        p.title_zh as product_title
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.agent_id = ?
    `;
    
    let params = [agentId];
    
    if (startDate && endDate) {
      query += ' AND DATE(o.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const [commissions] = await pool.execute(query, params);
    
    // 计算总计
    const totalCommission = commissions.reduce((sum, item) => sum + parseFloat(item.commission_amount || 0), 0);
    const totalRevenue = commissions.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    
    res.json({
      success: true,
      data: {
        commissions,
        summary: {
          totalCommission,
          totalRevenue,
          orderCount: commissions.length
        }
      }
    });
  } catch (error) {
    console.error('获取代理佣金报告失败:', error);
    res.status(500).json({ success: false, message: '获取代理佣金报告失败' });
  }
});

// 代理邀请客户API
app.post('/api/agent/invite', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const { email, phone, name } = req.body;
    const agentId = req.user.id;
    
    // 生成邀请码
    const inviteCode = 'INV' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 先检查agent_invites表是否存在，如果不存在则创建
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS agent_invites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agent_id INT NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          name VARCHAR(100),
          invite_code VARCHAR(50) UNIQUE NOT NULL,
          status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          accepted_at TIMESTAMP NULL,
          FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } catch (tableError) {
      console.log('agent_invites表已存在或创建失败:', tableError.message);
    }
    
    // 创建邀请记录
    await pool.execute(`
      INSERT INTO agent_invites (agent_id, email, phone, name, invite_code, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `, [agentId, email, phone, name, inviteCode]);
    
    res.json({
      success: true,
      data: {
        inviteCode,
        message: '邀请已发送'
      }
    });
  } catch (error) {
    console.error('发送邀请失败:', error);
    res.status(500).json({ success: false, message: '发送邀请失败' });
  }
});

// 获取代理邀请记录
app.get('/api/agent/invites', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const agentId = req.user.id;
    
    const [invites] = await pool.execute(`
      SELECT 
        id,
        email,
        phone,
        name,
        invite_code,
        status,
        created_at,
        accepted_at
      FROM agent_invites
      WHERE agent_id = ?
      ORDER BY created_at DESC
    `, [agentId]);
    
    res.json({
      success: true,
      data: invites
    });
  } catch (error) {
    console.error('获取邀请记录失败:', error);
    res.status(500).json({ success: false, message: '获取邀请记录失败' });
  }
});

// 代理推荐产品API
app.get('/api/agent/recommended-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    // 获取热门产品（按订单数排序）
    const [products] = await pool.execute(`
      SELECT 
        p.*,
        u.username as merchant_name,
        COUNT(o.id) as order_count,
        10 as commission_rate
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      LEFT JOIN orders o ON p.id = o.product_id
      WHERE p.status = 'approved'
      GROUP BY p.id
      ORDER BY order_count DESC, p.created_at DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('获取推荐产品失败:', error);
    res.status(500).json({ success: false, message: '获取推荐产品失败' });
  }
});

// 获取订单详情
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orders] = await pool.execute(`
      SELECT o.*, p.title_zh as product_title, p.title_th as product_title_th,
             u.username as customer_username, m.username as merchant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users m ON o.merchant_id = m.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = orders[0];

    // 权限检查
    if (req.user.role === 'merchant' && order.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限查看此订单' });
    }
    
    if ((req.user.role === 'customer' || req.user.role === 'user') && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限查看此订单' });
    }

    // 添加兼容字段
    const orderWithCompat = {
      ...order,
      order_number: order.order_no,
      quantity: order.total_people,
      total_amount: order.total_price
    };

    res.json({
      success: true,
      data: { order: orderWithCompat }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ success: false, message: '获取订单详情失败' });
  }
});

// 更新订单状态
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 检查订单是否存在
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = orders[0];

    // 权限检查
    if (req.user.role === 'merchant' && order.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限修改此订单' });
    }

    // 验证状态转换
    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'archived', 'returned'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的订单状态' });
    }

    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
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

// 管理员API - 获取统计数据
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看统计数据' });
    }

    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [merchantCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "merchant"');
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingMerchants] = await pool.execute('SELECT COUNT(*) as count FROM merchants WHERE status = "pending"');

    res.json({
      success: true,
      data: {
        totalUsers: userCount[0].count,
        totalMerchants: merchantCount[0].count,
        totalProducts: productCount[0].count,
        totalOrders: orderCount[0].count,
        pendingApprovals: pendingMerchants[0].count,
        totalRevenue: 125680 // 模拟数据
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

// 管理员API - 用户管理
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看用户列表' });
    }

    const [users] = await pool.execute(`
      SELECT id, username, email, phone, role, status, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改用户信息' });
    }

    const { id } = req.params;
    const { username, email, phone, role, status } = req.body;

    await pool.execute(`
      UPDATE users SET username = ?, email = ?, phone = ?, role = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [username, email, phone, role, status, id]);

    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '更新用户信息失败' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以删除用户' });
    }

    const { id } = req.params;
    
    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: '不能删除自己的账户' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

// 管理员API - 商家管理
app.get('/api/admin/merchants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看商家列表' });
    }

    const [merchants] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.phone, u.status as user_status, u.created_at,
             m.store_name, m.store_description, m.contact_person, m.contact_phone, 
             m.address, m.status as merchant_status
      FROM users u
      LEFT JOIN merchants m ON u.id = m.user_id
      WHERE u.role = 'merchant'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: merchants
    });
  } catch (error) {
    console.error('获取商家列表错误:', error);
    res.status(500).json({ success: false, message: '获取商家列表失败' });
  }
});

app.put('/api/admin/merchants/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改商家状态' });
    }

    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE merchants SET status = ?, updated_at = NOW() WHERE user_id = ?', [status, id]);

    res.json({
      success: true,
      message: '商家状态更新成功'
    });
  } catch (error) {
    console.error('更新商家状态错误:', error);
    res.status(500).json({ success: false, message: '更新商家状态失败' });
  }
});

// 管理员API - 产品管理
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看所有产品' });
    }

    const [products] = await pool.execute(`
      SELECT p.*, u.username as merchant_name
      FROM products p
      LEFT JOIN users u ON p.merchant_id = u.id
      
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

app.put('/api/admin/products/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改产品状态' });
    }

    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: '产品状态更新成功'
    });
  } catch (error) {
    console.error('更新产品状态错误:', error);
    res.status(500).json({ success: false, message: '更新产品状态失败' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以删除产品' });
    }

    const { id } = req.params;
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ success: false, message: '删除产品失败' });
  }
});

// 管理员API - 订单管理
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看所有订单' });
    }

    const [orders] = await pool.execute(`
      SELECT o.*, u.username as customer_name, m.username as merchant_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users m ON o.merchant_id = m.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

// 管理员API - 分类管理
app.get('/api/admin/categories', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以管理分类' });
    }

    const [categories] = await pool.execute(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.sort_order ASC, c.id ASC
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

app.post('/api/admin/categories', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以添加分类' });
    }

    const { name, parent_id, icon, sort_order, status } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO categories (name, parent_id, icon, sort_order, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [name, parent_id || null, icon, sort_order, status]);

    res.json({
      success: true,
      message: '分类添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加分类错误:', error);
    res.status(500).json({ success: false, message: '添加分类失败' });
  }
});

app.put('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改分类' });
    }

    const { id } = req.params;
    const { name, parent_id, icon, sort_order, status } = req.body;

    await pool.execute(`
      UPDATE categories SET name = ?, parent_id = ?, icon = ?, sort_order = ?, status = ?
      WHERE id = ?
    `, [name, parent_id || null, icon, sort_order, status, id]);

    res.json({
      success: true,
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

app.delete('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以删除分类' });
    }

    const { id } = req.params;
    
    // 检查是否有子分类
    const [children] = await pool.execute('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [id]);
    if (children[0].count > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有子分类，无法删除' });
    }

    // 检查是否有产品使用此分类
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (products[0].count > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有产品，无法删除' });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// 管理员API - 系统设置
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看系统设置' });
    }

    // 返回默认设置（实际项目中应该从数据库读取）
    const settings = {
      site_name: 'TTKH旅游系统',
      site_description: '专业的旅游产品预订平台',
      site_logo: '',
      contact_email: 'admin@ttkh.com',
      contact_phone: '+66-123-456-789',
      address: '泰国曼谷',
      currency: 'THB',
      tax_rate: 7,
      shipping_fee: 0,
      free_shipping_threshold: 1000,
      payment_methods: {
        alipay: true,
        wechat: true,
        bank_card: false
      },
      email_notifications: true,
      sms_notifications: false,
      maintenance_mode: false
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取系统设置错误:', error);
    res.status(500).json({ success: false, message: '获取系统设置失败' });
  }
});

app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以修改系统设置' });
    }

    // 实际项目中应该保存到数据库
    console.log('系统设置更新:', req.body);

    res.json({
      success: true,
      message: '系统设置保存成功'
    });
  } catch (error) {
    console.error('保存系统设置错误:', error);
    res.status(500).json({ success: false, message: '保存系统设置失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎉 MySQL后端服务器启动成功！`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🗄️  数据库: MySQL (${DB_CONFIG.database})`);
  console.log(`📋 测试账户:`);
  console.log(`   管理员: admin / admin123`);
  console.log(`   商家: merchant / merchant123`);
  console.log(`   用户: user / user123`);
  console.log(`\n🎯 准备就绪，等待前端连接...`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🔄 正在关闭服务器...');
  await pool.end();
  console.log('✅ 数据库连接池已关闭');
  process.exit(0);
});
