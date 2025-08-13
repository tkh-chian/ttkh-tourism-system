const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAgentUser() {
  console.log('开始创建代理用户...');
  
  try {
    // 连接数据库
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 检查代理用户是否已存在
    const [existingUsers] = await conn.execute(
      'SELECT id, email, role, status FROM users WHERE email = ?',
      ['agent@test.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('代理用户已存在，更新状态和密码...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      // 更新用户状态和密码
      const [result] = await conn.execute(
        'UPDATE users SET status = ?, password = ? WHERE email = ?',
        ['active', hashedPassword, 'agent@test.com']
      );
      
      console.log(`✅ 已更新代理用户: ${result.affectedRows > 0 ? '成功' : '失败'}`);
    } else {
      console.log('代理用户不存在，创建新用户...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      const userId = uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 创建代理用户
      const [result] = await conn.execute(
        'INSERT INTO users (id, username, email, password, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, 'agent', 'agent@test.com', hashedPassword, 'agent', 'active', now, now]
      );
      
      console.log(`✅ 已创建代理用户: ${result.affectedRows > 0 ? '成功' : '失败'}`);
    }
    
    // 验证代理用户
    const [users] = await conn.execute(
      'SELECT id, email, role, status FROM users WHERE email = ?',
      ['agent@test.com']
    );
    
    if (users.length > 0) {
      console.log('代理用户信息:', users[0]);
    } else {
      console.log('❌ 创建代理用户失败，未找到用户');
    }
    
    await conn.end();
    console.log('\n✅ 代理用户创建/更新完成！');
    
  } catch (error) {
    console.error('❌ 创建代理用户过程中出错:', error);
  }
}

createAgentUser();