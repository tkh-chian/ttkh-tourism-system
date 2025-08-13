const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 模拟数据
let users = [
  {
    id: '1',
    username: 'merchant',
    password: 'merchant123',
    role: 'merchant',
    company_name: '测试商家',
    status: 'approved'
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    status: 'approved'
  },
  {
    id: '3',
    username: 'agent',
    password: 'agent123',
    role: 'agent',
    company_name: '测试代理',
    status: 'approved'
  },
  {
    id: '4',
    username: 'customer',
    password: 'customer123',
    role: 'customer',
    status: 'approved'
  }
];

let products = [
  {
    id: '3a3f1748-7381-4ed6-94ff-c0388461efd0',
    merchant_id: '1',
    title_zh: '测试产品1',
    title_th: 'ผลิตภัณฑ์ทดสอบ 1',
    description_zh: '这是第一个测试产品',
    description_th: 'นี่คือผลิตภัณฑ์ทดสอบแรก',
    base_price: 1000,
    status: 'draft',
    poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    schedules: []
  },
  {
    id: 'b4c2e859-8492-5fe7-a5ff-d1399572fae1',
    merchant_id: '1',
    title_zh: '测试产品2',
    title_th: 'ผลิตภัณฑ์ทดสอบ 2',
    description_zh: '这是第二个测试产品',
    description_th: 'นี่คือผลิตภัณฑ์ทดสอบที่สอง',
    base_price: 1200,
    status: 'approved',
    poster_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    schedules: [
      {
        id: 'schedule1',
        travel_date: '2024-12-15',
        price: 1500,
        available_slots: 20,
        booked_slots: 5
      }
    ]
  }
];

let orders = [];
let agentPricings = [];

console.log('🎯 初始化测试数据: 2 个产品');

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '完整测试服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  console.log('登录请求:', req.body.username);
  
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  const token = `mock-token-${user.id}-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        company_name: user.company_name,
        status: user.status
      },
      token
    }
  });
});

// 获取用户信息
app.get('/api/auth/profile', (req, res) => {
  console.log('获取用户信息请求');
  
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        username: 'merchant',
        role: 'merchant',
        company_name: '测试商家',
        status: 'approved'
      }
    }
  });
});

// 获取商家产品列表
app.get('/api/products/merchant/my-products', (req, res) => {
  console.log('获取商家产品列表请求');
  
  const merchantProducts = products.filter(p => p.merchant_id === '1');
  
  res.json({
    success: true,
    data: {
      products: merchantProducts,
      pagination: {
        total: merchantProducts.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(merchantProducts.length / 10)
      }
    }
  });
});

// 创建产品
app.post('/api/products', (req, res) => {
  console.log('创建产品请求:', req.body);
  
  const product = {
    id: Date.now().toString(),
    merchant_id: '1',
    ...req.body,
    status: 'draft',
    schedules: [],
    created_at: new Date().toISOString()
  };
  
  products.push(product);
  
  res.status(201).json({
    success: true,
    message: '产品创建成功',
    data: { product }
  });
});

// 删除产品
app.delete('/api/products/:id', (req, res) => {
  console.log('删除产品请求:', req.params.id);
  
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  products.splice(productIndex, 1);
  
  res.json({
    success: true,
    message: '产品删除成功'
  });
});

// 添加价格日历
app.post('/api/products/:id/schedules', (req, res) => {
  console.log('添加价格日历请求:', req.params.id, req.body);
  
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  const schedule = {
    id: Date.now().toString(),
    product_id: req.params.id,
    travel_date: req.body.travel_date,
    price: req.body.price,
    available_slots: req.body.available_slots,
    booked_slots: 0
  };
  
  if (!product.schedules) {
    product.schedules = [];
  }
  product.schedules.push(schedule);
  
  res.json({
    success: true,
    message: '价格日历添加成功',
    data: { schedule }
  });
});

// 提交产品审核
app.put('/api/products/:id/submit', (req, res) => {
  console.log('提交审核请求:', req.params.id);
  
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  product.status = 'pending';
  
  res.json({
    success: true,
    message: '产品已提交审核',
    data: { product }
  });
});

// 管理员审核通过
app.put('/api/admin/products/:id/approve', (req, res) => {
  console.log('管理员审核通过:', req.params.id);
  
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  product.status = 'approved';
  
  res.json({
    success: true,
    message: '产品审核通过',
    data: { product }
  });
});

// 管理员审核拒绝
app.put('/api/admin/products/:id/reject', (req, res) => {
  console.log('管理员审核拒绝:', req.params.id, req.body);
  
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  product.status = 'rejected';
  product.reject_reason = req.body.reason || '未通过审核';
  
  res.json({
    success: true,
    message: '产品审核拒绝',
    data: { product }
  });
});

// 获取公开产品列表
app.get('/api/products', (req, res) => {
  console.log('获取公开产品列表请求');
  
  const approvedProducts = products.filter(p => p.status === 'approved');
  
  res.json({
    success: true,
    data: {
      products: approvedProducts,
      pagination: {
        total: approvedProducts.length,
        page: 1,
        limit: 12,
        totalPages: Math.ceil(approvedProducts.length / 12)
      }
    }
  });
});

// 用户下单
app.post('/api/orders', (req, res) => {
  console.log('用户下单请求:', req.body);
  
  const order = {
    id: Date.now().toString(),
    user_id: req.body.user_id || '4',
    product_id: req.body.product_id,
    schedule_id: req.body.schedule_id,
    quantity: req.body.quantity || 1,
    total_price: req.body.total_price,
    status: 'pending',
    customer_info: req.body.customer_info,
    created_at: new Date().toISOString()
  };
  
  orders.push(order);
  
  // 更新库存
  const product = products.find(p => p.id === req.body.product_id);
  if (product && product.schedules) {
    const schedule = product.schedules.find(s => s.id === req.body.schedule_id);
    if (schedule) {
      schedule.booked_slots += req.body.quantity;
    }
  }
  
  res.json({
    success: true,
    message: '订单创建成功',
    data: { order }
  });
});

// 获取订单列表
app.get('/api/orders', (req, res) => {
  console.log('获取订单列表请求');
  
  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total: orders.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(orders.length / 10)
      }
    }
  });
});

// 商家处理订单
app.put('/api/orders/:id/status', (req, res) => {
  console.log('商家处理订单:', req.params.id, req.body);
  
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }
  
  order.status = req.body.status;
  if (req.body.note) {
    order.note = req.body.note;
  }
  order.updated_at = new Date().toISOString();
  
  res.json({
    success: true,
    message: '订单状态更新成功',
    data: { order }
  });
});

// 代理产品二次定价
app.post('/api/agent/products/:id/pricing', (req, res) => {
  console.log('代理二次定价:', req.params.id, req.body);
  
  const agentPricing = {
    id: Date.now().toString(),
    agent_id: req.body.agent_id || '3',
    product_id: req.params.id,
    markup_percentage: req.body.markup_percentage,
    fixed_markup: req.body.fixed_markup,
    final_price: req.body.final_price,
    created_at: new Date().toISOString()
  };
  
  agentPricings.push(agentPricing);
  
  res.json({
    success: true,
    message: '代理定价设置成功',
    data: { pricing: agentPricing }
  });
});

// 获取代理定价列表
app.get('/api/agent/pricing', (req, res) => {
  console.log('获取代理定价列表请求');
  
  res.json({
    success: true,
    data: {
      pricings: agentPricings,
      pagination: {
        total: agentPricings.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(agentPricings.length / 10)
      }
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🎯 初始化测试数据: 2 个产品');
  console.log('🎉 完整测试服务器已启动！');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔑 测试账户:');
  console.log('  管理员: admin / admin123');
  console.log('  商家: merchant / merchant123');
  console.log('  代理: agent / agent123');
  console.log('  用户: customer / customer123');
});