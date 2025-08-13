const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function prepareCompleteTestEnvironment() {
  let connection;
  
  try {
    console.log('🚀 开始准备完整人工测试环境...\n');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 清理并重建数据库结构
    console.log('\n📋 步骤1: 重建数据库结构...');
    
    // 删除所有表（按依赖关系顺序）
    const dropTables = [
      'DROP TABLE IF EXISTS price_schedules',
      'DROP TABLE IF EXISTS orders', 
      'DROP TABLE IF EXISTS products',
      'DROP TABLE IF EXISTS users'
    ];
    
    for (const sql of dropTables) {
      await connection.execute(sql);
    }
    console.log('✅ 清理旧表完成');
    
    // 创建users表
    await connection.execute(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'merchant', 'agent', 'customer') NOT NULL DEFAULT 'customer',
        company_name VARCHAR(200),
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ users表创建完成');
    
    // 创建products表
    await connection.execute(`
      CREATE TABLE products (
        id VARCHAR(36) PRIMARY KEY,
        product_number VARCHAR(50) UNIQUE NOT NULL,
        merchant_id VARCHAR(36) NOT NULL,
        title_zh VARCHAR(200) NOT NULL,
        title_th VARCHAR(200),
        description_zh TEXT,
        description_th TEXT,
        base_price DECIMAL(10,2) DEFAULT 0.00,
        poster_image LONGTEXT,
        poster_filename VARCHAR(255),
        pdf_file LONGTEXT,
        pdf_filename VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ products表创建完成');
    
    // 创建price_schedules表
    await connection.execute(`
      CREATE TABLE price_schedules (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        travel_date DATE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total_stock INT NOT NULL DEFAULT 0,
        available_stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_product_date (product_id, travel_date),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ price_schedules表创建完成');
    
    // 创建orders表
    await connection.execute(`
      CREATE TABLE orders (
        id VARCHAR(36) PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        merchant_id VARCHAR(36) NOT NULL,
        agent_id VARCHAR(36),
        customer_id VARCHAR(36),
        product_title VARCHAR(200) NOT NULL,
        travel_date DATE NOT NULL,
        adults INT DEFAULT 0,
        children_no_bed INT DEFAULT 0,
        children_with_bed INT DEFAULT 0,
        infants INT DEFAULT 0,
        total_people INT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        customer_email VARCHAR(100),
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
        status ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
        notes TEXT,
        rejection_reason TEXT,
        scan_document LONGTEXT,
        scan_filename VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ orders表创建完成');
    
    // 2. 创建测试用户
    console.log('\n👥 步骤2: 创建测试用户...');
    
    const testUsers = [
      {
        id: uuidv4(),
        username: '系统管理员',
        email: 'admin@ttkh.com',
        password: 'admin123',
        role: 'admin',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试商家',
        email: 'merchant@ttkh.com',
        password: 'merchant123',
        role: 'merchant',
        company_name: '泰国旅游有限公司',
        contact_person: '张经理',
        phone: '086-1234567890',
        status: 'pending' // 待审核状态，用于测试审核流程
      },
      {
        id: uuidv4(),
        username: '测试代理',
        email: 'agent@ttkh.com',
        password: 'agent123',
        role: 'agent',
        company_name: '旅游代理公司',
        contact_person: '李代理',
        phone: '086-0987654321',
        status: 'approved'
      },
      {
        id: uuidv4(),
        username: '测试客户',
        email: 'customer@ttkh.com',
        password: 'customer123',
        role: 'customer',
        status: 'approved'
      }
    ];
    
    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      await connection.execute(
        `INSERT INTO users (id, username, email, password_hash, role, company_name, contact_person, phone, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.email, passwordHash, user.role, 
         user.company_name || null, user.contact_person || null, user.phone || null, user.status]
      );
      
      console.log(`✅ 创建用户: ${user.username} (${user.email}) - 状态: ${user.status}`);
    }
    
    // 3. 检查测试文件
    console.log('\n📁 步骤3: 检查测试文件...');
    const downloadsPath = 'C:\\Users\\46405\\txkafa8.7\\ttkh-tourism-system\\downloads';
    
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
      console.log('✅ 创建downloads目录');
    }
    
    // 创建示例测试文件
    const testPosterPath = path.join(downloadsPath, 'test-poster.jpg');
    const testPdfPath = path.join(downloadsPath, 'test-document.pdf');
    
    if (!fs.existsSync(testPosterPath)) {
      // 创建一个简单的测试图片文件（base64编码的1x1像素图片）
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
      fs.writeFileSync(testPosterPath, 'Test poster image file for TTKH Tourism System');
      console.log('✅ 创建测试海报文件');
    }
    
    if (!fs.existsSync(testPdfPath)) {
      fs.writeFileSync(testPdfPath, 'Test PDF document file for TTKH Tourism System');
      console.log('✅ 创建测试PDF文件');
    }
    
    // 4. 验证数据库结构
    console.log('\n🔍 步骤4: 验证数据库结构...');
    
    const tables = ['users', 'products', 'price_schedules', 'orders'];
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${table}表: ${rows[0].count} 条记录`);
    }
    
    // 5. 生成测试指南
    console.log('\n📖 步骤5: 生成人工测试指南...');
    
    const testGuide = `
# TTKH旅游系统 - 人工测试指南

## 🎯 测试环境信息
- 前端地址: http://localhost:3000
- 后端地址: http://localhost:3001
- 数据库: MySQL 8.0 (ttkh_tourism)
- 测试文件目录: C:\\Users\\46405\\txkafa8.7\\ttkh-tourism-system\\downloads

## 👥 测试账户
1. **管理员账户**
   - 邮箱: admin@ttkh.com
   - 密码: admin123
   - 权限: 审核商家、审核产品、查看所有数据

2. **商家账户** (待审核状态)
   - 邮箱: merchant@ttkh.com
   - 密码: merchant123
   - 公司: 泰国旅游有限公司
   - 联系人: 张经理
   - 状态: 待审核 (需要管理员审核)

3. **代理账户**
   - 邮箱: agent@ttkh.com
   - 密码: agent123
   - 公司: 旅游代理公司
   - 联系人: 李代理
   - 状态: 已审核

4. **客户账户**
   - 邮箱: customer@ttkh.com
   - 密码: customer123
   - 状态: 已审核

## 🧪 测试流程

### 第一步: 商家注册和审核
1. 使用管理员账户登录 (admin@ttkh.com / admin123)
2. 进入"商家管理"页面
3. 查看待审核商家列表，应该看到"泰国旅游有限公司"
4. 点击"审核通过"按钮
5. 验证商家状态从"待审核"变为"已批准"

### 第二步: 商家创建产品
1. 使用商家账户登录 (merchant@ttkh.com / merchant123)
2. 进入"产品管理" -> "创建产品"
3. 填写产品信息:
   - 中文标题: 泰国曼谷3日游
   - 泰文标题: ทัวร์กรุงเทพ 3 วัน
   - 中文描述: 精彩的曼谷之旅，包含大皇宫、卧佛寺等景点
   - 基础价格: 1500
4. 上传海报图片 (从downloads目录选择test-poster.jpg)
5. 上传PDF文档 (从downloads目录选择test-document.pdf)
6. 点击"创建产品"
7. 验证产品编号自动生成 (格式: PRD-时间戳)

### 第三步: 设置价格日历
1. 在产品列表中找到刚创建的产品
2. 点击"设置价格日历"
3. 选择未来7天的日期
4. 为每个日期设置:
   - 价格: 1500-2000元
   - 库存: 10-20人
5. 保存价格日历设置

### 第四步: 管理员审核产品
1. 使用管理员账户登录
2. 进入"产品管理"页面
3. 查看待审核产品列表
4. 找到"泰国曼谷3日游"产品
5. 点击"审核通过"
6. 验证产品状态变为"已批准"

### 第五步: 验证产品展示
1. 退出登录，访问首页
2. 验证产品卡片正确显示:
   - 产品标题
   - 产品编号 (显示在标题下方)
   - 海报图片
   - 基础价格
   - "查看详情"按钮

### 第六步: 代理下单
1. 使用代理账户登录 (agent@ttkh.com / agent123)
2. 在首页点击产品"查看详情"
3. 选择出行日期 (从价格日历中选择)
4. 填写订单信息:
   - 成人数量: 2
   - 儿童数量: 1
   - 客户姓名: 测试客户
   - 客户电话: 13800138000
   - 客户邮箱: test@example.com
5. 上传扫描件 (选择downloads目录中的文件)
6. 提交订单
7. 验证订单编号自动生成 (格式: ORD-时间戳)

### 第七步: 商家订单管理
1. 使用商家账户登录
2. 进入"订单管理"页面
3. 查看新订单列表
4. 测试订单操作:
   - 查看订单详情
   - 确认订单 (状态: 待确认 -> 已确认)
   - 拒绝订单 (填写拒绝原因)
   - 完成订单 (状态: 已确认 -> 已完成)

## ✅ 验证要点
- [ ] 商家注册审核流程完整
- [ ] 产品编号唯一性 (PRD-时间戳格式)
- [ ] 订单编号唯一性 (ORD-时间戳格式)
- [ ] 文件上传功能正常 (海报、PDF、扫描件)
- [ ] 价格日历设置和显示正确
- [ ] 产品审核流程完整
- [ ] 首页产品卡片正确展示
- [ ] 订单创建和管理功能完整
- [ ] 所有用户角色权限正确

## 🚨 注意事项
- 确保前后端服务都在运行
- 测试文件位于指定目录
- 按照流程顺序进行测试
- 每个步骤都要验证结果
`;

    fs.writeFileSync('人工测试完整指南.md', testGuide);
    console.log('✅ 人工测试指南已生成');
    
    console.log('\n🎉 人工测试环境准备完成！');
    console.log('\n📋 测试摘要:');
    console.log('- ✅ 数据库结构重建完成');
    console.log('- ✅ 测试用户创建完成 (4个角色)');
    console.log('- ✅ 测试文件准备完成');
    console.log('- ✅ 测试指南生成完成');
    console.log('\n🚀 现在可以启动系统进行人工测试！');
    
  } catch (error) {
    console.error('❌ 准备测试环境失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行准备脚本
prepareCompleteTestEnvironment().catch(console.error);