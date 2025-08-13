const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 创建一个完整的测试服务器
const app = express();
const PORT = 3002; // 使用不同的端口
const JWT_SECRET = 'ttkh-secret-key-2025';

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 创建测试用户数据
const testUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    status: 'approved',
    company_name: 'TTKH Admin',
    contact_person: 'Admin User',
    phone: '1234567890',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    username: 'merchant',
    email: 'merchant@example.com',
    password_hash: bcrypt.hashSync('merchant123', 10),
    role: 'merchant',
    status: 'approved',
    company_name: 'TTKH Tours',
    contact_person: 'Merchant User',
    phone: '1234567891',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    username: 'agent',
    email: 'agent@example.com',
    password_hash: bcrypt.hashSync('agent123', 10),
    role: 'agent',
    status: 'approved',
    company_name: 'TTKH Agency',
    contact_person: 'Agent User',
    phone: '1234567892',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '4',
    username: 'customer',
    email: 'customer@example.com',
    password_hash: bcrypt.hashSync('customer123', 10),
    role: 'customer',
    status: 'approved',
    company_name: null,
    contact_person: null,
    phone: '1234567893',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// 创建测试产品数据
const testProducts = [
  {
    id: '1',
    merchant_id: '2',
    title_zh: '曼谷一日游',
    title_th: 'ทัวร์กรุงเทพ 1 วัน',
    description_zh: '探索曼谷的寺庙和市场',
    description_th: 'สำรวจวัดและตลาดในกรุงเทพ',
    base_price: 1000,
    poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
    poster_filename: 'bangkok_tour.jpg',
    pdf_file: null,
    pdf_filename: null,
    status: 'approved',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    merchant_id: '2',
    title_zh: '清迈两日游',
    title_th: 'ทัวร์เชียงใหม่ 2 วัน',
    description_zh: '体验清迈的文化和自然风光',
    description_th: 'สัมผัสวัฒนธรรมและธรรมชาติของเชียงใหม่',
    base_price: 2000,
    poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
    poster_filename: 'chiangmai_tour.jpg',
    pdf_file: null,
    pdf_filename: null,
    status: 'approved',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// 创建测试价格日历数据
const testSchedules = [
  {
    id: '1',
    product_id: '1',
    travel_date: '2025-09-01',
    price: 1200,
    total_stock: 20,
    available_stock: 20,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    product_id: '1',
    travel_date: '2025-09-02',
    price: 1200,
    total_stock: 20,
    available_stock: 20,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    product_id: '2',
    travel_date: '2025-09-10',
    price: 2200,
    total_stock: 15,
    available_stock: 15,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '4',
    product_id: '2',
    travel_date: '2025-09-11',
    price: 2200,
    total_stock: 15,
    available_stock: 15,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// 创建测试订单数据
const testOrders = [];

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = testUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '无效的访问令牌' });
  }
};

// ==================== 认证路由 ====================

// 用户登录 - 同时支持username和email
app.post('/api/auth/login', (req, res) => {
  try {
    console.log('登录请求:', req.body);
    const { username, password, email } = req.body;
    
    // 支持两种参数格式
    const loginEmail = email || username;
    
    if (!loginEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名/邮箱和密码为必填项' 
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = testUsers.find(u => 
      u.username === loginEmail || u.email === loginEmail
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户状态
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: user.status === 'pending' ? '账户待审核' : '账户已被禁用'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // 移除密码字段
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

// 用户注册
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, role = 'customer', company_name, contact_person, phone } = req.body;

    // 检查邮箱是否已存在
    const existingUser = testUsers.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已被注册' });
    }

    // 创建新用户
    const newUser = {
      id: (testUsers.length + 1).toString(),
      username,
      email,
      password_hash: bcrypt.hashSync(password, 10),
      role,
      status: role === 'customer' ? 'approved' : 'pending',
      company_name: company_name || null,
      contact_person: contact_person || null,
      phone: phone || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    testUsers.push(newUser);

    res.status(201).json({
      success: true,
      message: role === 'customer' ? '注册成功' : '注册成功，请等待管理员审核',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        },
        needsApproval: role !== 'customer'
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '注册失败', error: error.message });
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
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
});

// 用户登出
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// ==================== 产品路由 ====================

// 获取产品列表
app.get('/api/products', (req, res) => {
  try {
    const { status = 'approved', merchant_id } = req.query;
    
    let filteredProducts = testProducts.filter(p => p.status === status);
    
    if (merchant_id) {
      filteredProducts = filteredProducts.filter(p => p.merchant_id === merchant_id);
    }
    
    res.json({
      success: true,
      data: { products: filteredProducts }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败', error: error.message });
  }
});

// 获取产品详情
app.get('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    // 获取价格日历
    const schedules = testSchedules.filter(s => s.product_id === id);
    
    res.json({
      success: true,
      data: { 
        product: {
          ...product,
          schedules
        }
      }
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ success: false, message: '获取产品详情失败', error: error.message });
  }
});

// 创建产品
app.post('/api/products', authenticateToken, (req, res) => {
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

    const newProduct = {
      id: (testProducts.length + 1).toString(),
      merchant_id: req.user.id,
      title_zh,
      title_th,
      description_zh,
      description_th,
      base_price,
      poster_image,
      poster_filename,
      pdf_file,
      pdf_filename,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    testProducts.push(newProduct);

    res.status(201).json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId: newProduct.id }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '创建产品失败', error: error.message });
  }
});

// 批量设置价格日历
app.post('/api/products/:id/schedules/batch', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    // 验证产品归属
    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (product.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此产品' });
    }

    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const existingIndex = testSchedules.findIndex(s => 
        s.product_id === id && s.travel_date === schedule.date
      );

      if (existingIndex >= 0) {
        // 更新
        testSchedules[existingIndex].price = schedule.price;
        testSchedules[existingIndex].total_stock = schedule.stock;
        testSchedules[existingIndex].available_stock = schedule.stock;
        testSchedules[existingIndex].updated_at = new Date();
      } else {
        // 新增
        testSchedules.push({
          id: (testSchedules.length + 1).toString(),
          product_id: id,
          travel_date: schedule.date,
          price: schedule.price,
          total_stock: schedule.stock,
          available_stock: schedule.stock,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: '价格日历设置成功'
    });
  } catch (error) {
    console.error('设置价格日历错误:', error);
    res.status(500).json({ success: false, message: '设置价格日历失败', error: error.message });
  }
});

// ==================== 订单路由 ====================

// 创建订单
app.post('/api/orders', (req, res) => {
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
    const product = testProducts.find(p => p.id === product_id && p.status === 'approved');
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在或未上架' });
    }

    // 获取价格日历
    const schedule = testSchedules.find(s => s.product_id === product_id && s.travel_date === travel_date);
    if (!schedule) {
      return res.status(400).json({ success: false, message: '该日期暂未开放预订' });
    }

    const total_people = adults + children_no_bed + children_with_bed + infants;

    // 检查库存
    if (schedule.available_stock < total_people) {
      return res.status(400).json({ success: false, message: '库存不足' });
    }

    // 计算价格
    const unit_price = schedule.price;
    const total_price = unit_price * (adults + children_no_bed + children_with_bed); // 婴儿不计费

    // 生成订单号
    const order_number = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const newOrder = {
      id: (testOrders.length + 1).toString(),
      order_number,
      product_id,
      merchant_id: product.merchant_id,
      product_title: product.title_zh,
      travel_date,
      adults,
      children_no_bed,
      children_with_bed,
      infants,
      total_people,
      customer_name,
      customer_phone,
      customer_email,
      unit_price,
      total_price,
      notes,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    testOrders.push(newOrder);

    // 减少库存
    schedule.available_stock -= total_people;

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: { orderId: newOrder.id, order_number }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ success: false, message: '创建订单失败', error: error.message });
  }
});

// 获取订单列表
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    
    let filteredOrders = [...testOrders];
    
    // 根据用户角色过滤
    if (req.user.role === 'merchant') {
      filteredOrders = filteredOrders.filter(o => o.merchant_id === req.user.id);
    } else if (req.user.role === 'customer') {
      filteredOrders = filteredOrders.filter(o => o.customer_email === req.user.email);
    }
    
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }
    
    // 按创建时间降序排序
    filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      data: { orders: filteredOrders }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败', error: error.message });
  }
});

// 更新订单状态
app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    // 查找订单
    const orderIndex = testOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = testOrders[orderIndex];

    // 验证权限
    if (req.user.role === 'merchant' && order.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此订单' });
    }

    // 更新订单状态
    testOrders[orderIndex] = {
      ...order,
      status,
      rejection_reason: rejection_reason || null,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: '订单状态更新成功'
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ success: false, message: '更新订单状态失败', error: error.message });
  }
});

// ==================== 管理员路由 ====================

// 审核产品
app.put('/api/admin/products/:id/review', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核产品' });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    // 查找产品
    const productIndex = testProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    // 更新产品状态
    testProducts[productIndex] = {
      ...testProducts[productIndex],
      status,
      rejection_reason: rejection_reason || null,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: `产品${status === 'approved' ? '审核通过' : '审核拒绝'}`
    });
  } catch (error) {
    console.error('审核产品错误:', error);
    res.status(500).json({ success: false, message: '审核产品失败', error: error.message });
  }
});

// 审核用户
app.put('/api/admin/users/:id/review', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核用户' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 查找用户
    const userIndex = testUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 更新用户状态
    testUsers[userIndex] = {
      ...testUsers[userIndex],
      status,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: `用户${status === 'approved' ? '审核通过' : '审核拒绝'}`
    });
  } catch (error) {
    console.error('审核用户错误:', error);
    res.status(500).json({ success: false, message: '审核用户失败', error: error.message });
  }
});

// 获取待审核内容
app.get('/api/admin/pending', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看待审核内容' });
    }

    // 获取待审核用户
    const pendingUsers = testUsers
      .filter(u => u.status === 'pending')
      .map(({ password_hash, ...user }) => user);

    // 获取待审核产品
    const pendingProducts = testProducts
      .filter(p => p.status === 'pending')
      .map(p => ({
        ...p,
        merchant_name: testUsers.find(u => u.id === p.merchant_id)?.username || '未知商家'
      }));

    res.json({
      success: true,
      data: {
        pendingUsers,
        pendingProducts
      }
    });
  } catch (error) {
    console.error('获取待审核内容错误:', error);
    res.status(500).json({ success: false, message: '获取待审核内容失败', error: error.message });
  }
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`🔧 完整测试服务器启动成功！`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`📋 可用测试账户:`);
  console.log(`   管理员: admin / admin123`);
  console.log(`   商家: merchant / merchant123`);
  console.log(`   代理: agent / agent123`);
  console.log(`   用户: customer / customer123`);
  console.log(`\n🎯 准备就绪，等待前端连接...`);
});