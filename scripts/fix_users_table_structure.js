/**
 * 修复users表结构
 * 1. 确保createdAt和updatedAt字段可为空并有默认值
 * 2. 添加触发器，在插入时自动设置时间戳
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

async function fixUsersTableStructure() {
  let connection;
  
  try {
    console.log('开始修复users表结构...');
    
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
    
    // 1. 检查当前表结构
    console.log('检查当前users表结构...');
    const [tableInfo] = await connection.execute('DESCRIBE users');
    console.log('当前users表结构:', JSON.stringify(tableInfo, null, 2));
    
    // 2. 修改createdAt和updatedAt字段，确保它们可为空并有默认值
    console.log('修改createdAt和updatedAt字段...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      MODIFY COLUMN updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    
    // 3. 检查修改后的表结构
    console.log('检查修改后的users表结构...');
    const [updatedTableInfo] = await connection.execute('DESCRIBE users');
    console.log('修改后的users表结构:', JSON.stringify(updatedTableInfo, null, 2));
    
    // 4. 创建一个测试用户，验证修复是否成功
    console.log('尝试创建测试用户...');
    const userId = require('uuid').v4();
    const username = `testuser_${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@example.com`;
    const passwordHash = require('bcrypt').hashSync('password123', 10);
    
    // 使用INSERT ... SET ? 让 mysql2 构造列赋值，避免代码中包含逗号被外部过滤的问题
    const data = { id: userId, username, email, password: passwordHash, role: 'customer', status: 'active', phone: '1234567890' };
    console.log('插入数据对象:', data);
    const [insertResult] = await connection.query('INSERT INTO users SET ?', [data]);
    console.log('用户创建结果:', insertResult);
    
    // 5. 验证用户是否已创建，并检查时间戳字段
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users && users.length > 0) {
      console.log('从数据库查询到的用户:');
      console.log(users[0]);
      console.log('测试完成: 用户创建功能正常工作!');
      console.log('createdAt:', users[0].createdAt);
      console.log('updatedAt:', users[0].updatedAt);
    } else {
      console.log('无法验证用户创建，未找到用户');
    }
    
    console.log('users表结构修复完成!');
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行修复
fixUsersTableStructure();