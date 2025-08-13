const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306
};

const DB_NAME = 'ttkh_tourism';

async function setupCompleteDatabase() {
  let connection;
  
  try {
    console.log('🚀 开始设置完整的MySQL数据库...');
    
    // 连接到MySQL服务器
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 成功连接到MySQL服务器');
    
    // 创建数据库（如果不存在）
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${DB_NAME} 创建成功`);
    
    // 选择数据库
    await connection.query(`USE \`${DB_NAME}\``);
    // 暂时关闭外键检查，避免因类型差异导致建表失败；完成后会恢复为1
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. 创建用户表（使用 CHAR(36) 作为主键，与 Sequelize UUID 一致）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        avatar VARCHAR(255),
        role ENUM('admin', 'merchant', 'agent', 'customer') DEFAULT 'customer',
        status ENUM('active', 'inactive', 'pending', 'approved', 'rejected', 'suspended') DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 用户表创建成功');

    // 2. 创建商家信息表（user_id 使用 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS merchants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id CHAR(36) NOT NULL,
        store_name VARCHAR(100) NOT NULL,
        store_name_th VARCHAR(100),
        store_description TEXT,
        store_description_th TEXT,
        store_logo VARCHAR(255),
        business_license VARCHAR(255),
        contact_person VARCHAR(50),
        contact_phone VARCHAR(20),
        address TEXT,
        address_th TEXT,
        status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 商家信息表创建成功');

    // 3. 创建商品分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        name_th VARCHAR(50),
        parent_id INT DEFAULT NULL,
        icon VARCHAR(255),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_parent_id (parent_id),
        INDEX idx_status (status),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 商品分类表创建成功');

    // 4. 创建商品表（使用 CHAR(36) 主键，merchant_id 也为 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id CHAR(36) PRIMARY KEY NOT NULL,
        merchant_id CHAR(36) NOT NULL,
        category_id INT,
        title_zh VARCHAR(200) NOT NULL,
        title_th VARCHAR(200),
        description_zh TEXT,
        description_th TEXT,
        base_price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        poster_image LONGTEXT,
        poster_filename VARCHAR(255),
        pdf_file LONGTEXT,
        pdf_filename VARCHAR(255),
        specifications JSON,
        status ENUM('active', 'inactive', 'pending', 'approved', 'rejected', 'out_of_stock') DEFAULT 'pending',
        is_featured BOOLEAN DEFAULT FALSE,
        view_count INT DEFAULT 0,
        order_count INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        review_count INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_merchant_id (merchant_id),
        INDEX idx_category_id (category_id),
        INDEX idx_status (status),
        INDEX idx_is_featured (is_featured),
        INDEX idx_created_at (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 商品表创建成功');

    // 5. 创建价格日历表（product_id 使用 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS price_schedules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id CHAR(36) NOT NULL,
        travel_date DATE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total_stock INT DEFAULT 0,
        available_stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_date (product_id, travel_date),
        INDEX idx_product_id (product_id),
        INDEX idx_travel_date (travel_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 价格日历表创建成功');

    // 6. 创建购物车表（user_id/product_id 使用 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        travel_date DATE,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_date (user_id, product_id, travel_date),
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 购物车表创建成功');

    // 7. 创建订单表（user_id/merchant_id 使用 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        user_id CHAR(36) NOT NULL,
        merchant_id CHAR(36) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_fee DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'confirmed', 'cancelled', 'refunded', 'completed') DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        contact_info JSON NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (merchant_id) REFERENCES users(id),
        INDEX idx_order_no (order_no),
        INDEX idx_user_id (user_id),
        INDEX idx_merchant_id (merchant_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 订单表创建成功');

    // 8. 创建订单商品表（product_id 使用 CHAR(36)）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id CHAR(36) NOT NULL,
        product_title VARCHAR(200) NOT NULL,
        product_image VARCHAR(255),
        travel_date DATE,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 订单商品表创建成功');

    // 9. 创建收货地址表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id CHAR(36) NOT NULL,
        recipient_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        province VARCHAR(50) NOT NULL,
        city VARCHAR(50) NOT NULL,
        district VARCHAR(50) NOT NULL,
        detail_address VARCHAR(200) NOT NULL,
        postal_code VARCHAR(10),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 收货地址表创建成功');

    // 10. 创建商品评价表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        order_id INT NOT NULL,
        rating INT NOT NULL,
        content TEXT,
        images JSON,
        reply TEXT,
        reply_time TIMESTAMP NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id),
        INDEX idx_order_id (order_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 商品评价表创建成功');

    // 11. 创建轮播图表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        title_th VARCHAR(100),
        image VARCHAR(255) NOT NULL,
        link VARCHAR(255),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 轮播图表创建成功');

    // 12. 创建系统设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 系统设置表创建成功');

    // 插入测试数据（使用 UUID() 与子查询保证引用一致）
    console.log('📝 开始插入测试数据...');

    // 插入测试用户：使用 UUID() 生成 id
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const merchantPassword = bcrypt.hashSync('merchant123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);

    await connection.execute(`
      INSERT IGNORE INTO users (id, username, email, password_hash, role, status) VALUES
      (UUID(), 'admin', 'admin@ttkh.com', ?, 'admin', 'active'),
      (UUID(), 'merchant', 'merchant@ttkh.com', ?, 'merchant', 'approved'),
      (UUID(), 'user', 'user@ttkh.com', ?, 'customer', 'active')
    `, [adminPassword, merchantPassword, userPassword]);
    console.log('✅ 测试用户插入成功');

    // 插入商家信息，使用子查询拿到对应用户 id
    await connection.execute(`
      INSERT IGNORE INTO merchants (user_id, store_name, store_name_th, store_description, store_description_th, status)
      VALUES ((SELECT id FROM users WHERE username = 'merchant' LIMIT 1), '泰国旅游专家', 'ผู้เชี่ยวชาญท่องเที่ยวไทย', '专业的泰国旅游服务提供商', 'ผู้ให้บริการท่องเที่ยวไทยมืออาชีพ', 'approved')
    `);
    console.log('✅ 商家信息插入成功');

    // 插入分类
    await connection.execute(`
      INSERT IGNORE INTO categories (id, name, name_th, status) VALUES
      (1, '一日游', 'ทัวร์วันเดียว', 'active'),
      (2, '多日游', 'ทัวร์หลายวัน', 'active'),
      (3, '文化体验', 'ประสบการณ์วัฒนธรรม', 'active'),
      (4, '自然探索', 'สำรวจธรรมชาติ', 'active')
    `);
    console.log('✅ 分类数据插入成功');

    // 插入测试产品：使用子查询设置 merchant_id，并使用 UUID() 作为产品 id
    await connection.execute(`
      INSERT IGNORE INTO products (id, merchant_id, category_id, title_zh, title_th, description_zh, description_th, base_price, status, is_featured, view_count, order_count)
      VALUES
      (UUID(), (SELECT id FROM users WHERE username='merchant' LIMIT 1), 1, '曼谷一日游', 'ทัวร์กรุงเทพ 1 วัน', '探索曼谷的寺庙和市场，体验泰国文化', 'สำรวจวัดและตลาดในกรุงเทพ สัมผัสวัฒนธรรมไทย', 1000.00, 'approved', true, 150, 25),
      (UUID(), (SELECT id FROM users WHERE username='merchant' LIMIT 1), 2, '清迈两日游', 'ทัวร์เชียงใหม่ 2 วัน', '体验清迈的文化和自然风光', 'สัมผัสวัฒนธรรมและธรรมชาติของเชียงใหม่', 2000.00, 'approved', true, 89, 12),
      (UUID(), (SELECT id FROM users WHERE username='merchant' LIMIT 1), 3, '泰式烹饪课程', 'คอร์สทำอาหารไทย', '学习正宗的泰式料理制作', 'เรียนรู้การทำอาหารไทยแท้', 800.00, 'approved', false, 45, 8)
    `);
    console.log('✅ 测试产品插入成功');

    // 插入价格日历测试数据：使用子查询获取产品 id，并使用日期字符串 YYYY-MM-DD
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    const t1 = tomorrow.toISOString().split('T')[0];
    const t2 = dayAfter.toISOString().split('T')[0];

    await connection.execute(`
      INSERT IGNORE INTO price_schedules (product_id, travel_date, price, total_stock, available_stock) VALUES
      ((SELECT id FROM products WHERE title_zh='曼谷一日游' LIMIT 1), ?, 1000.00, 20, 20),
      ((SELECT id FROM products WHERE title_zh='曼谷一日游' LIMIT 1), ?, 1200.00, 15, 15),
      ((SELECT id FROM products WHERE title_zh='清迈两日游' LIMIT 1), ?, 2000.00, 10, 10),
      ((SELECT id FROM products WHERE title_zh='清迈两日游' LIMIT 1), ?, 2200.00, 8, 8)
    `, [t1, t2, t1, t2]);
    console.log('✅ 价格日历测试数据插入成功');

    // 插入轮播图
    await connection.execute(`
      INSERT IGNORE INTO banners (id, title, title_th, image, link, sort_order, status) VALUES
      (1, '泰国旅游特惠', 'โปรโมชั่นท่องเที่ยวไทย', '/images/banner1.jpg', '/products', 1, 'active'),
      (2, '清迈文化之旅', 'ทัวร์วัฒนธรรมเชียงใหม่', '/images/banner2.jpg', '/products/2', 2, 'active')
    `);
    console.log('✅ 轮播图数据插入成功');

    // 插入系统设置
    await connection.execute(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
      ('site_name', 'TTKH旅游系统', '网站名称'),
      ('site_description', '专业的泰国旅游服务平台', '网站描述'),
      ('contact_email', 'contact@ttkh.com', '联系邮箱'),
      ('contact_phone', '+66-123-456-789', '联系电话'),
      ('currency', 'THB', '默认货币'),
      ('language', 'zh', '默认语言')
    `);
    console.log('✅ 系统设置插入成功');

    console.log('🎉 完整的MySQL数据库设置完成！');
    console.log('📊 数据库统计:');
    
    // 统计数据
    const [userCountRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [productCountRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [categoryCountRows] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    
    console.log(`   - 用户数量: ${userCountRows[0].count}`);
    console.log(`   - 产品数量: ${productCountRows[0].count}`);
    console.log(`   - 分类数量: ${categoryCountRows[0].count}`);
    
    console.log('\n🔑 测试账户:');
    console.log('   管理员: admin / admin123');
    console.log('   商家: merchant / merchant123');
    console.log('   用户: user / user123');

  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        // 恢复外键检查（如果之前已关闭）
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        console.warn('恢复外键检查失败（可忽略）:', e && e.message);
      }
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 运行设置
if (require.main === module) {
  setupCompleteDatabase()
    .then(() => {
      console.log('🚀 数据库设置完成，可以启动应用了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 设置失败:', error);
      process.exit(1);
    });
}

module.exports = { setupCompleteDatabase };