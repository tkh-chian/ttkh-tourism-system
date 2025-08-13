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

// 模拟数据 - 确保每次重启都有测试数据
let products = [
  {
    id: '3a3f1748-7381-4ed6-94ff-c0388461efd0',
    title_zh: '测试产品1',
    title_th: 'ผลิตภัณฑ์ทดสอบ 1',
    description_zh: '这是第一个测试产品',
    description_th: 'นี่คือผลิตภัณฑ์ทดสอบแรก',
    base_price: 100,
    status: 'approved',
    view_count: 5,
    order_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-product-2',
    title_zh: '测试产品2',
    title_th: 'ผลิตภัณฑ์ทดสอบ 2',
    description_zh: '这是第二个测试产品',
    description_th: 'นี่คือผลิตภัณฑ์ทดสอบที่สอง',
    base_price: 200,
    status: 'pending',
    view_count: 3,
    order_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

console.log(`🎯 初始化测试数据: ${products.length} 个产品`);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// 模拟用户数据
const users = {
  merchant: {
    id: '1',
    username: 'merchant',
    password: 'merchant123',
    role: 'merchant',
    company_name: '测试商家',
    status: 'approved'
  },
  admin: {
    id: '2',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    status: 'approved'
  }
};

// 登录API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`登录请求: ${username}`);
  
  const user = users[username];
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 模拟JWT token
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
      token: token
    }
  });
});

// 获取用户信息
app.get('/api/auth/profile', (req, res) => {
  console.log('获取用户信息请求');
  res.json({
    success: true,
    data: {
      user: users.merchant
    }
  });
});

// 获取商家产品列表
app.get('/api/products/merchant/my-products', (req, res) => {
  console.log('获取商家产品列表请求');
  res.json({
    success: true,
    data: {
      products: products,
      pagination: {
        total: products.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    }
  });
});

// 删除产品
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  console.log(`删除产品请求: ${id}`);
  
  const productIndex = products.findIndex(p => p.id === id);
  
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

// 创建产品
app.post('/api/products', (req, res) => {
  console.log('创建产品请求:', req.body);
  
  const newProduct = {
    id: Date.now().toString(),
    ...req.body,
    status: 'draft',
    view_count: 0,
    order_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    message: '产品创建成功',
    data: { product: newProduct }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎉 测试服务器已启动！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});