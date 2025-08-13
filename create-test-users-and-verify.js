const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function createTestUsers() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查用户表结构
    console.log('\n📋 检查用户表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('用户表字段:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // 删除现有测试用户
    console.log('\n🗑️ 清理现有测试用户...');
    await connection.execute(`DELETE FROM users WHERE username IN ('admin', 'merchant', 'customer') OR email IN ('admin@test.com', 'merchant@test.com', 'customer@test.com')`);
    console.log('✅ 清理完成');

    // 创建测试用户
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin',
        status: 'approved',
        name: '管理员'
      },
      {
        username: 'merchant',
        email: 'merchant@test.com',
        password: 'merchant123',
        role: 'merchant',
        status: 'approved',
        name: '测试商家'
      },
      {
        username: 'customer',
        email: 'customer@test.com',
        password: 'customer123',
        role: 'customer',
        status: 'approved',
        name: '测试客户'
      }
    ];

    console.log('\n👥 创建测试用户...');
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      try {
        const userId = uuidv4();
        await connection.execute(`
          INSERT INTO users (id, username, email, password_hash, role, status, contact_person, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [userId, user.username, user.email, hashedPassword, user.role, user.status, user.name]);
        
        console.log(`✅ 创建用户: ${user.username} (${user.role})`);
      } catch (error) {
        console.log(`❌ 创建用户 ${user.username} 失败:`, error.message);
      }
    }

    // 验证用户创建
    console.log('\n🔍 验证用户创建结果...');
    const [users] = await connection.execute(`
      SELECT id, username, email, role, status, contact_person, created_at 
      FROM users 
      WHERE username IN ('admin', 'merchant', 'customer')
      ORDER BY role
    `);

    console.log('创建的用户:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 状态: ${user.status}`);
    });

    // 创建一些测试产品
    console.log('\n📦 创建测试产品...');
    
    // 找到商家用户ID
    const [merchantUser] = await connection.execute(`
      SELECT id FROM users WHERE username = 'merchant' LIMIT 1
    `);
    
    if (merchantUser.length > 0) {
      const merchantId = merchantUser[0].id;
      
      const testProducts = [
        {
          title_zh: '曼谷一日游',
          title_th: 'Bangkok Day Tour',
          description_zh: '探索曼谷的历史文化和现代魅力',
          description_th: 'Explore Bangkok history, culture and modern charm',
          base_price: 1500,
          status: 'active'
        },
        {
          title_zh: '普吉岛海滩度假',
          title_th: 'Phuket Beach Holiday',
          description_zh: '享受普吉岛美丽的海滩和清澈的海水',
          description_th: 'Enjoy beautiful beaches and clear waters of Phuket',
          base_price: 2500,
          status: 'active'
        }
      ];

      for (const product of testProducts) {
        try {
          const productNumber = 'P' + Date.now() + Math.floor(Math.random() * 1000);
          
          await connection.execute(`
            INSERT INTO products (
              product_number, title_zh, title_th, description_zh, description_th, 
              base_price, status, merchant_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            productNumber, product.title_zh, product.title_th, 
            product.description_zh, product.description_th,
            product.base_price, product.status, merchantId
          ]);
          
          console.log(`✅ 创建产品: ${product.title_zh}`);
        } catch (error) {
          console.log(`❌ 创建产品失败:`, error.message);
        }
      }
    }

    console.log('\n🎉 测试数据创建完成！');
    return true;

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 测试登录功能
async function testLogin() {
  const axios = require('axios');
  
  console.log('\n🔐 测试登录功能...');
  
  const testUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'merchant', password: 'merchant123', role: 'merchant' },
    { username: 'customer', password: 'customer123', role: 'customer' }
  ];

  for (const user of testUsers) {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        username: user.username,
        password: user.password
      });

      if (response.data.success) {
        console.log(`✅ ${user.role}登录成功`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      } else {
        console.log(`❌ ${user.role}登录失败: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${user.role}登录错误: ${error.response?.data?.message || error.message}`);
    }
  }
}

// 运行创建和测试
async function run() {
  console.log('🚀 开始创建测试用户和数据...');
  console.log('='.repeat(50));
  
  const success = await createTestUsers();
  
  if (success) {
    console.log('\n⏳ 等待2秒后测试登录...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testLogin();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 测试用户创建和验证完成！');
}

run().catch(console.error);