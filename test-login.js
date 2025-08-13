const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 创建一个简单的服务器来修复登录问题
const app = express();
const PORT = 3001;
const JWT_SECRET = 'ttkh-secret-key-2025';

// 中间件
app.use(cors());
app.use(express.json());

// 创建测试用户数据
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
  },
  {
    id: '3',
    username: 'agent',
    email: 'agent@example.com',
    password_hash: bcrypt.hashSync('agent123', 10),
    role: 'agent',
    status: 'approved'
  },
  {
    id: '4',
    username: 'customer',
    email: 'customer@example.com',
    password_hash: bcrypt.hashSync('customer123', 10),
    role: 'customer',
    status: 'approved'
  }
];

// 用户登录 - 同时支持username和email
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('登录请求:', { username, password });

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码为必填项' 
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = testUsers.find(u => 
      u.username === username || u.email === username
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

// 获取用户信息
app.get('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供访问令牌'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = testUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const { password_hash, ...safeUser } = user;
    
    res.json({
      success: true,
      data: { user: safeUser }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
});

// 其他API路由
app.all('/api/*', (req, res) => {
  res.json({
    success: true,
    message: '请求成功',
    data: {}
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🔧 登录修复服务器启动成功！`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`📋 可用测试账户:`);
  console.log(`   管理员: admin / admin123`);
  console.log(`   商家: merchant / merchant123`);
  console.log(`   代理: agent / agent123`);
  console.log(`   用户: customer / customer123`);
  console.log(`\n🎯 准备就绪，等待前端连接...`);
});