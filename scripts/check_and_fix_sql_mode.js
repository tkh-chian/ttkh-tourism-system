/**
 * 检查并修复MySQL的SQL模式
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

async function checkAndFixSQLMode() {
  let connection;
  
  try {
    console.log('开始检查并修复MySQL的SQL模式...');
    
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
    
    // 检查当前的SQL模式
    const [sqlModeResult] = await connection.execute('SELECT @@sql_mode');
    console.log('当前SQL模式:', sqlModeResult[0]['@@sql_mode']);
    
    // 修改SQL模式，移除STRICT_TRANS_TABLES和NO_ZERO_DATE
    console.log('尝试修改SQL模式...');
    const currentMode = sqlModeResult[0]['@@sql_mode'];
    let newMode = currentMode
      .split(',')
      .filter(mode => mode !== 'STRICT_TRANS_TABLES' && mode !== 'NO_ZERO_DATE' && mode !== 'NO_ZERO_IN_DATE')
      .join(',');
    
    await connection.execute(`SET GLOBAL sql_mode = '${newMode}'`);
    await connection.execute(`SET SESSION sql_mode = '${newMode}'`);
    
    // 验证修改后的SQL模式
    const [newSqlModeResult] = await connection.execute('SELECT @@sql_mode');
    console.log('修改后的SQL模式:', newSqlModeResult[0]['@@sql_mode']);
    
    // 尝试创建一个测试用户
    console.log('尝试创建测试用户...');
    const userId = require('uuid').v4();
    const username = `testuser_${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@example.com`;
    const passwordHash = require('bcrypt').hashSync('password123', 10);
    
    // 使用明确的NULL值
    const sql = `
      INSERT INTO users 
        (id, username, email, password, role, status, phone, createdAt, updatedAt) 
      VALUES 
        (?, ?, ?, ?, 'customer', 'active', '1234567890', NULL, NULL)
    `;
    
    const [result] = await connection.execute(sql, [userId, username, email, passwordHash]);
    console.log('用户创建成功!', result);
    
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
    console.error('操作失败:', error);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行检查和修复
checkAndFixSQLMode();