const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixLoginIssue() {
  console.log('开始修复登录问题...');
  
  try {
    // 连接数据库
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查用户状态
    const [users] = await conn.execute(
      'SELECT id, email, password, role, status FROM users WHERE email IN (?, ?, ?, ?)',
      ['merchant@test.com', 'admin@ttkh.com', 'agent@test.com', 'user@test.com']
    );
    
    console.log('现有用户状态:');
    users.forEach(user => {
      console.log(`- ${user.email}: 角色=${user.role}, 状态=${user.status}, 密码=${user.password ? '已设置' : '未设置'}`);
    });
    
    // 2. 修复所有测试用户的状态和密码
    const testUsers = [
      { email: 'merchant@test.com', role: 'merchant', password: '123456' },
      { email: 'admin@ttkh.com', role: 'admin', password: 'admin123' },
      { email: 'agent@test.com', role: 'agent', password: '123456' },
      { email: 'user@test.com', role: 'customer', password: '123456' }
    ];
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // 更新用户状态和密码
      const [result] = await conn.execute(
        'UPDATE users SET status = ?, password = ? WHERE email = ?',
        ['active', hashedPassword, user.email]
      );
      
      console.log(`✅ 已修复用户 ${user.email}: ${result.affectedRows > 0 ? '成功' : '未找到用户'}`);
    }
    
    // 3. 验证修复结果
    const [updatedUsers] = await conn.execute(
      'SELECT id, email, password, role, status FROM users WHERE email IN (?, ?, ?, ?)',
      ['merchant@test.com', 'admin@ttkh.com', 'agent@test.com', 'user@test.com']
    );
    
    console.log('\n修复后的用户状态:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.email}: 角色=${user.role}, 状态=${user.status}, 密码=${user.password ? '已设置' : '未设置'}`);
    });
    
    await conn.end();
    console.log('\n✅ 登录问题修复完成！现在可以使用以下账户登录:');
    console.log('- 管理员: admin@ttkh.com / admin123');
    console.log('- 商家: merchant@test.com / 123456');
    console.log('- 代理: agent@test.com / 123456');
    console.log('- 用户: user@test.com / 123456');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixLoginIssue();