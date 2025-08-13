const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'ttkh-secret-key-2025';

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 测试数据
const testUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    status: 'approved'
  },
  {
    id: '2',
    username: 'merchant',
    email: 'merchant@example.com',
    password_hash: bcrypt.hashSync('merchant123', 10),
    role: 'merchant',
    status: 'approved'
  }
];

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
    view_count: 150,
    order_count: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    status: 'pending',
    view_count: 89,
    order_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

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

// 基础路由
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: '服务器运行正常' });
});

// 登录路由
app.post('/api/auth/login', (req, res) => {
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

    const user = testUsers.find(u => 
      u.username === loginEmail || u.email === loginEmail
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

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
    // 在实际应用中，这里可能需要将token加入黑名单
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
app.get('/api/products', (req, res) => {
  try {
    res.json({
      success: true,
      data: { products: testProducts }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

// 获取产品详情 - 支持路径参数
app.get('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

// 获取产品详情 - 使用查询参数而不是路径参数（保持兼容性）
app.get('/api/product-detail', (req, res) => {
  try {
    const { id } = req.query;
    
    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
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
app.post('/api/products', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以创建产品' });
    }

    const newProduct = {
      id: (testProducts.length + 1).toString(),
      merchant_id: req.user.id,
      ...req.body,
      status: 'pending',
      created_at: new Date()
    };

    testProducts.push(newProduct);

    res.status(201).json({
      success: true,
      message: '产品创建成功，等待审核',
      data: { productId: newProduct.id }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '创建产品失败' });
  }
});

// 获取商家的产品列表
app.get('/api/products/merchant/my-products', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以查看自己的产品' });
    }

    const merchantProducts = testProducts.filter(p => p.merchant_id === req.user.id);
    
    res.json({
      success: true,
      data: { products: merchantProducts }
    });
  } catch (error) {
    console.error('获取商家产品列表错误:', error);
    res.status(500).json({ success: false, message: '获取商家产品列表失败' });
  }
});

// 删除产品
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以删除产品' });
    }

    const { id } = req.params;
    const productIndex = testProducts.findIndex(p => p.id === id && p.merchant_id === req.user.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限删除' });
    }

    testProducts.splice(productIndex, 1);

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
app.put('/api/products/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ success: false, message: '只有商家可以更新产品' });
    }

    const { id } = req.params;
    const productIndex = testProducts.findIndex(p => p.id === id && p.merchant_id === req.user.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: '产品不存在或无权限修改' });
    }

    testProducts[productIndex] = {
      ...testProducts[productIndex],
      ...req.body,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: '产品更新成功',
      data: { product: testProducts[productIndex] }
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ success: false, message: '更新产品失败' });
  }
});

// 存储价格日历数据
const testSchedules = [];

// 获取产品的价格日历
app.get('/api/products/:id/schedules', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    // 如果是商家，检查权限
    if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限查看此产品的价格日历' });
    }

    // 只返回已设置的价格日历
    const schedules = testSchedules.filter(s => s.product_id === id);

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
app.post('/api/products/:id/schedules/batch', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    const product = testProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此产品' });
    }

    // 批量插入或更新价格日历
    for (const schedule of schedules) {
      const existingIndex = testSchedules.findIndex(s => 
        s.product_id === id && s.travel_date === schedule.date
      );

      if (existingIndex >= 0) {
        // 更新现有记录
        testSchedules[existingIndex] = {
          ...testSchedules[existingIndex],
          price: schedule.price,
          total_stock: schedule.stock,
          available_stock: schedule.stock,
          updated_at: new Date()
        };
      } else {
        // 新增记录
        testSchedules.push({
          id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
    res.status(500).json({ success: false, message: '设置价格日历失败' });
  }
});

// 获取订单列表
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: { orders: [] }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🔧 简单测试服务器启动成功！`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`📋 测试账户:`);
  console.log(`   管理员: admin / admin123`);
  console.log(`   商家: merchant / merchant123`);
  console.log(`\n🎯 准备就绪，等待前端连接...`);
});