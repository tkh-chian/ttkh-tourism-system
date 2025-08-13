const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeModels } = require('./models');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/auth'); // 修改为auth路由
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));

// 增加请求头大小限制
app.use((req, res, next) => {
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
});

app.use(express.json({ 
  limit: '50mb',
  parameterLimit: 50000
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 50000
}));

// 设置服务器请求头大小限制
app.use((req, res, next) => {
  req.setTimeout(30000); // 30秒超时
  next();
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TTKH Tourism System Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// 价格日程路由已在产品路由中定义，无需单独注册

// 添加初始化和创建测试用户的路由
app.get('/init', async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

app.get('/create-test-users', async (req, res) => {
  try {
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@example.com',
      name: 'Admin User'
    });

    const merchantUser = await User.create({
      username: 'merchant1',
      password: 'merchant123',
      role: 'merchant',
      email: 'merchant1@example.com',
      name: 'Merchant User'
    });

    const customerUser = await User.create({
      username: 'customer1',
      password: 'customer123',
      role: 'customer',
      email: 'customer1@example.com',
      name: 'Customer User'
    });

    res.status(200).json({ 
      message: 'Test users created successfully',
      users: [adminUser, merchantUser, customerUser]
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ error: 'Failed to create test users' });
  }
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'TTKH Tourism System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误处理:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    console.log('🚀 正在启动TTKH旅游系统后端服务...');
    
    // 初始化数据库和模型
    await initializeModels();
    console.log('✅ 数据库和模型初始化完成');

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🎉 服务器已启动！`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API文档: http://localhost:${PORT}/`);
      console.log('');
      console.log('🔑 测试账户:');
      console.log('  管理员: admin / admin123');
      console.log('  商家: merchant / merchant123');
      console.log('  代理: agent / agent123');
      console.log('  用户: customer / customer123');
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      server.close(() => {
        console.log('✅ HTTP服务器已关闭');
        
        // 关闭数据库连接
        const { sequelize } = require('./models');
        if (sequelize) {
          sequelize.close().then(() => {
            console.log('✅ 数据库连接已关闭');
            process.exit(0);
          }).catch((error) => {
            console.error('❌ 关闭数据库连接时出错:', error);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });
    };

    // 监听进程信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
};

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;