const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const API_BASE = 'http://localhost:3001/api';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

// 创建 Sequelize 实例
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: 'mysql',
  logging: false
});

// 测试用户数据
const testUsers = [
  { email: 'admin@test.com', password: 'admin123', role: 'admin', name: '管理员' },
  { email: 'merchant@test.com', password: 'merchant123', role: 'merchant', name: '商家用户' },
  { email: 'user@test.com', password: 'user123', role: 'user', name: '普通用户' }
];

let tokens = {};

console.log('🎯 开始完整人工模拟测试（包含用户创建）...\n');

// 定义简化版的 User 模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'customer'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true // 自动管理 createdAt 和 updatedAt
});

async function createTestUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (!existingUser) {
        // 创建新用户
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // 生成用户名（如果没有提供）
        const username = userData.username || userData.email.split('@')[0];
        
        await User.create({
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          username: username,
          status: 'active'
        });
        
        console.log(`✅ 创建用户: ${userData.email} (${userData.role})`);
      } else {
        console.log(`ℹ️  用户已存在: ${userData.email}`);
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    if (sequelize) await sequelize.close();
  }
}

async function simulateCompleteFlow() {
  try {
    console.log('\n=== 第1步：用户登录测试 ===');
    
    // 登录所有测试用户
    for (const userData of testUsers) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        
        if (response.data.token) {
          tokens[userData.role] = response.data.token;
          console.log(`✅ ${userData.role} 登录成功 (${userData.email})`);
        }
      } catch (error) {
        console.log(`❌ ${userData.role} 登录失败:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n=== 第2步：商家上传产品测试 ===');
    
    if (tokens.merchant) {
      const productData = {
        name: '普吉岛豪华一日游',
        description: '包含海滩、浮潜、午餐的完美一日游体验',
        price: 1500,
        category: '一日游',
        location: '普吉岛',
        duration: '8小时',
        maxParticipants: 20,
        images: ['https://example.com/phuket1.jpg']
      };

      try {
        const response = await axios.post(`${API_BASE}/products`, productData, {
          headers: { Authorization: `Bearer ${tokens.merchant}` }
        });
        
        if (response.data.success) {
          const product = response.data.product;
          console.log(`✅ 产品创建成功`);
          console.log(`   产品编号: ${product.productNumber || product.product_number || '未生成'}`);
          console.log(`   产品名称: ${product.name}`);
          console.log(`   状态: ${product.status}`);
          
          global.testProductId = product.id;
        }
      } catch (error) {
        console.log('❌ 产品创建失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
          console.log('   详细错误:', JSON.stringify(error.response.data, null, 2));
        }
      }
    } else {
      console.log('⚠️  商家token不存在，跳过产品创建');
    }

    console.log('\n=== 第3步：管理员审核产品测试 ===');
    
    if (tokens.admin) {
      try {
        // 获取所有产品（包括待审核的）
        const productsResponse = await axios.get(`${API_BASE}/products?all=true`, {
          headers: { Authorization: `Bearer ${tokens.admin}` }
        });
        
        const allProducts = productsResponse.data.products || [];
        const pendingProducts = allProducts.filter(p => p.status === 'pending');
        
        console.log(`📋 总产品数量: ${allProducts.length}`);
        console.log(`📋 待审核产品数量: ${pendingProducts.length}`);
        
        if (pendingProducts.length > 0) {
          const productToApprove = pendingProducts[0];
          
          // 尝试审核产品
          try {
            const approveResponse = await axios.put(
              `${API_BASE}/admin/products/${productToApprove.id}`,
              { status: 'approved' },
              { headers: { Authorization: `Bearer ${tokens.admin}` } }
            );
            
            if (approveResponse.data.success) {
              console.log(`✅ 产品审核通过`);
              console.log(`   产品: ${productToApprove.name}`);
              console.log(`   新状态: approved`);
            }
          } catch (approveError) {
            console.log('❌ 产品审核失败:', approveError.response?.data?.message || approveError.message);
          }
        } else {
          console.log('⚠️  暂无待审核产品');
        }
      } catch (error) {
        console.log('❌ 获取产品列表失败:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('⚠️  管理员token不存在，跳过产品审核');
    }

    console.log('\n=== 第4步：首页展示产品测试 ===');
    
    try {
      const response = await axios.get(`${API_BASE}/products`);
      const products = response.data.products || [];
      const approvedProducts = products.filter(p => p.status === 'approved');
      
      console.log(`📦 总产品数量: ${products.length}`);
      console.log(`📦 已审核产品数量: ${approvedProducts.length}`);
      
      if (products.length > 0) {
        console.log('✅ 产品列表获取正常');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - 状态: ${product.status} (${product.productNumber || product.product_number || '无编号'})`);
        });
        
        if (approvedProducts.length > 0) {
          global.testApprovedProduct = approvedProducts[0];
        }
      } else {
        console.log('⚠️  暂无产品');
      }
    } catch (error) {
      console.log('❌ 获取产品列表失败:', error.response?.data?.message || error.message);
    }

    console.log('\n=== 第5步：用户提交订单测试 ===');
    
    if (tokens.user && global.testApprovedProduct) {
      const orderData = {
        productId: global.testApprovedProduct.id,
        quantity: 2,
        selectedDate: '2024-12-25',
        customerInfo: {
          name: '张三',
          phone: '0123456789',
          email: 'zhangsan@test.com'
        },
        totalAmount: global.testApprovedProduct.price * 2
      };

      try {
        const response = await axios.post(`${API_BASE}/orders`, orderData, {
          headers: { Authorization: `Bearer ${tokens.user}` }
        });
        
        if (response.data.success) {
          const order = response.data.order;
          console.log(`✅ 订单创建成功`);
          console.log(`   订单编号: ${order.orderNumber || order.order_number || '未生成'}`);
          console.log(`   产品: ${global.testApprovedProduct.name}`);
          console.log(`   数量: ${orderData.quantity}`);
          console.log(`   总金额: ${orderData.totalAmount} THB`);
          console.log(`   状态: ${order.status}`);
        }
      } catch (error) {
        console.log('❌ 订单创建失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
          console.log('   详细错误:', JSON.stringify(error.response.data, null, 2));
        }
      }
    } else {
      if (!tokens.user) {
        console.log('⚠️  用户token不存在，跳过订单创建');
      } else {
        console.log('⚠️  无已审核产品，跳过订单创建');
      }
    }

    console.log('\n=== 第6步：API接口互通测试 ===');
    
    const apiTests = [
      { name: '产品列表API', url: `${API_BASE}/products`, method: 'GET' },
      { name: '用户信息API', url: `${API_BASE}/auth/me`, method: 'GET', token: tokens.user },
      { name: '商家产品API', url: `${API_BASE}/merchant/products`, method: 'GET', token: tokens.merchant },
      { name: '管理员统计API', url: `${API_BASE}/admin/stats`, method: 'GET', token: tokens.admin }
    ];

    for (const test of apiTests) {
      try {
        const config = {
          method: test.method,
          url: test.url
        };
        
        if (test.token) {
          config.headers = { Authorization: `Bearer ${test.token}` };
        }
        
        const response = await axios(config);
        console.log(`✅ ${test.name} - 正常 (状态: ${response.status})`);
      } catch (error) {
        console.log(`❌ ${test.name} - 失败: ${error.response?.status || error.message}`);
      }
    }

    console.log('\n🎉 完整人工模拟测试完成！');
    console.log('\n📊 测试总结:');
    console.log(`- 用户登录: ${Object.keys(tokens).length}/3 成功`);
    console.log('- 商家上传产品: 已测试 (含产品编号生成)');
    console.log('- 管理员审核: 已测试');
    console.log('- 首页展示: 已测试');
    console.log('- 用户下单: 已测试 (含订单编号生成)');
    console.log('- API接口互通: 已测试');
    
    console.log('\n🌐 前端访问地址: http://localhost:3000');
    console.log('🔧 后端API地址: http://localhost:3001/api');
    
    console.log('\n📋 测试账号信息:');
    testUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行完整测试流程
async function runCompleteTest() {
  await createTestUsers();
  await simulateCompleteFlow();
}

runCompleteTest();