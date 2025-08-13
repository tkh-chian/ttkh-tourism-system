const axios = require('axios');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function debugLoginIssue() {
  console.log('开始调试登录问题...');
  
  try {
    // 连接数据库
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查用户表结构
    const [columns] = await conn.execute('DESCRIBE users');
    console.log('用户表结构:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(必填)' : '(可选)'}`);
    });
    
    // 2. 检查测试用户
    const [users] = await conn.execute(
      'SELECT id, username, email, password, role, status FROM users WHERE email IN (?, ?, ?, ?)',
      ['merchant@test.com', 'admin@ttkh.com', 'agent@test.com', 'user@test.com']
    );
    
    console.log('\n现有测试用户:');
    users.forEach(user => {
      console.log(`- ${user.email}: 角色=${user.role}, 状态=${user.status}, 密码=${user.password ? '已设置' : '未设置'}, 用户名=${user.username}`);
    });
    
    // 3. 测试登录API - 使用用户名
    console.log('\n测试登录API (使用用户名):');
    try {
      const response1 = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'merchant',
        password: '123456'
      });
      console.log('✅ 登录成功:', response1.data);
    } catch (error) {
      console.error('❌ 登录失败:', error.response ? error.response.data : error.message);
    }
    
    // 4. 测试登录API - 使用邮箱
    console.log('\n测试登录API (使用邮箱):');
    try {
      const response2 = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'merchant@test.com',
        password: '123456'
      });
      console.log('✅ 登录成功:', response2.data);
    } catch (error) {
      console.error('❌ 登录失败:', error.response ? error.response.data : error.message);
    }
    
    // 5. 检查authController.js中的登录逻辑
    console.log('\n检查登录日志:');
    try {
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(__dirname, 'backend', 'auth_login.log');
      if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n').slice(-10);
        console.log('最近10条登录日志:');
        logs.forEach(log => console.log(`- ${log}`));
      } else {
        console.log('未找到登录日志文件');
      }
    } catch (error) {
      console.error('读取日志出错:', error.message);
    }
    
    // 6. 修复用户密码 - 使用bcrypt直接更新
    console.log('\n尝试修复用户密码:');
    for (const user of users) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const [result] = await conn.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, user.email]
      );
      console.log(`- ${user.email}: ${result.affectedRows > 0 ? '密码已更新' : '更新失败'}`);
    }
    
    // 7. 再次测试登录
    console.log('\n修复后再次测试登录:');
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'merchant@test.com',
        password: '123456'
      });
      console.log('✅ 登录成功:', response.data);
    } catch (error) {
      console.error('❌ 登录失败:', error.response ? error.response.data : error.message);
      
      // 8. 如果仍然失败，检查请求和响应详情
      if (error.response) {
        console.log('请求详情:');
        console.log('- 状态码:', error.response.status);
        console.log('- 响应数据:', error.response.data);
        console.log('- 请求头:', error.config.headers);
        console.log('- 请求数据:', error.config.data);
      }
    }
    
    await conn.end();
    console.log('\n调试完成');
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  }
}

debugLoginIssue();