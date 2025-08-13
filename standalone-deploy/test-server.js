const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 添加根路由
app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 TTKH Tourism System API</h1>
    <p>服务器正在运行！</p>
    <h2>可用端点：</h2>
    <ul>
      <li><a href="/health">GET /health</a> - 健康检查</li>
      <li>POST /api/auth/login - 用户登录</li>
      <li><a href="/api/products">GET /api/products</a> - 获取产品</li>
      <li>POST /api/products - 创建产品</li>
      <li><a href="/api/orders">GET /api/orders</a> - 获取订单</li>
      <li>POST /api/orders - 创建订单</li>
    </ul>
    <h2>测试账号：</h2>
    <ul>
      <li>管理员: admin / admin123</li>
      <li>商户: merchant1 / merchant123</li>
      <li>客户: customer1 / customer123</li>
    </ul>
  `);
});

// 内存数据
let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'merchant1', password: 'merchant123', role: 'merchant' },
  { id: 3, username: 'customer1', password: 'customer123', role: 'customer' }
];

let products = [
  { id: 1, name: '曼谷一日游', price: 1500, description: '探索曼谷的文化和美食' },
  { id: 2, name: '普吉岛海滩游', price: 2500, description: '享受阳光沙滩和海水' }
];

let orders = [];

// API 路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ 
      success: true, 
      token: 'fake-jwt-token', 
      user: { id: user.id, username: user.username, role: user.role }
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: products.length + 1,
    ...req.body
  };
  products.push(newProduct);
  res.json({ success: true, data: newProduct });
});

app.get('/api/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  res.json({ success: true, data: newOrder });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '服务器运行正常！'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`🌐 请访问: http://localhost:${PORT}`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});