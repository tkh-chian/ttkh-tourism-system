/**
 * 使用mysql2直接创建用户
 * 完全绕过Sequelize
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createUserWithDirectMySQL() {
  let connection;
  
  try {
    console.log('开始使用mysql2直接创建用户...');
    
    // 从环境变量获取数据库配置
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ttkh_tourism'
    };
    
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 生成随机用户名和邮箱以避免冲突
    const randomSuffix = Math.floor(Math.random() * 10000);
    const username = `testuser${randomSuffix}`;
    const email = `test${randomSuffix}@example.com`;
    
    // 生成密码哈希
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 生成 UUID
    const userId = uuidv4();
    
    // 构建SQL查询 - 不指定createdAt和updatedAt字段，让MySQL使用默认值
    const sql = `
      INSERT INTO users 
        (id, username, email, password, role, status, phone) 
      VALUES 
        (?, ?, ?, ?, 'customer', 'active', '1234567890')
    `;
    
    // 执行SQL查询
    const [result] = await connection.execute(sql, [userId, username, email, passwordHash]);
    
    console.log('用户创建成功!');
    console.log('用户ID:', userId);
    console.log('用户名:', username);
    
    // 验证用户是否已创建
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users && users.length > 0) {
      console.log('从数据库查询到的用户:');
      console.log(users[0]);
      console.log('测试完成: 用户创建功能正常工作!');
    } else {
      console.log('无法验证用户创建，未找到用户');
    }
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行测试
createUserWithDirectMySQL();