const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

async function fixAdminAndTest() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism',
    charset: 'utf8mb4'
  });
  
  try {
    console.log('🔍 检查admin用户...');
    
    // 删除现有admin用户（如果存在）
    await pool.execute('DELETE FROM users WHERE email = ? OR username = ?', ['admin@ttkh.com', 'admin']);
    console.log('✅ 清理现有admin用户');
    
    // 创建新的admin用户
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userId = uuidv4();
    
    await pool.execute(
      'INSERT INTO users (id, username, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, 'admin', 'admin@ttkh.com', passwordHash, 'admin', 'approved']
    );
    console.log('✅ 创建新admin用户成功');
    
    // 验证用户创建
    const [users] = await pool.execute('SELECT id, username, email, role, status FROM users WHERE email = ?', ['admin@ttkh.com']);
    console.log('📋 Admin用户信息:', users[0]);
    
    await pool.end();
    
    // 等待1秒让数据库更新
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试登录API
    console.log('\n🧪 测试登录API...');
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@ttkh.com',
        password: 'admin123'
      });
      
      console.log('✅ 登录成功!');
      console.log('📋 响应数据:', {
        success: response.data.success,
        user: response.data.user,
        token: response.data.token ? '已生成' : '未生成'
      });
      
    } catch (error) {
      console.error('❌ 登录失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error);
    await pool.end();
  }
}

fixAdminAndTest();