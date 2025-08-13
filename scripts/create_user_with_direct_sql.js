/**
 * 使用原生 SQL 创建用户
 * 绕过 Sequelize 的时间戳处理
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { sequelize } = require('../backend/config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createUserWithDirectSQL() {
  try {
    console.log('开始使用原生 SQL 创建用户...');
    
    // 连接数据库
    await sequelize.authenticate();
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
    
    // 当前时间戳，格式化为 MySQL datetime 格式
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 构建完全原生的 SQL 查询 - 使用当前时间戳
    const sql = `
      INSERT INTO users 
        (id, username, email, password, role, status, phone, createdAt, updatedAt) 
      VALUES 
        ('${userId}', '${username}', '${email}', '${passwordHash}', 'customer', 'active', '1234567890', '${now}', '${now}')
    `;
    
    // 执行原生 SQL 查询，不使用参数替换
    const [result] = await sequelize.query(sql, {
      type: sequelize.QueryTypes.INSERT
    });
    
    console.log('用户创建成功!');
    console.log('用户ID:', userId);
    console.log('用户名:', username);
    console.log('创建时间:', now);
    
    // 验证用户是否已创建
    const [users] = await sequelize.query('SELECT * FROM users WHERE id = ?', {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (users) {
      console.log('从数据库查询到的用户:');
      console.log(users);
      console.log('测试完成: 用户创建功能正常工作!');
    } else {
      console.log('无法验证用户创建，未找到用户');
    }
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行测试
createUserWithDirectSQL();