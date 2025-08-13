const { sequelize } = require('./config/database');
const mysql = require('mysql2/promise');

async function fixDatabase() {
  try {
    console.log('🔧 开始修复数据库...');
    
    // 创建直接的MySQL连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Lhjr@170103',
      database: process.env.DB_NAME || 'ttkh_tourism'
    });

    console.log('✅ 数据库连接成功');

    // 1. 检查users表中的NULL username
    console.log('🔍 检查users表中的NULL username...');
    const [nullUsers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE username IS NULL OR username = ""'
    );
    
    console.log(`发现 ${nullUsers.length} 个用户的username为空`);

    // 2. 为NULL的username生成唯一值
    if (nullUsers.length > 0) {
      console.log('🔄 修复NULL username...');
      for (let i = 0; i < nullUsers.length; i++) {
        const user = nullUsers[i];
        let newUsername;
        
        if (user.email) {
          // 使用email的用户名部分
          newUsername = user.email.split('@')[0];
        } else {
          // 使用user_前缀加索引
          newUsername = `user_${Date.now()}_${i}`;
        }
        
        // 确保username唯一
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [newUsername]
        );
        
        if (existing.length > 0) {
          newUsername = `${newUsername}_${Date.now()}`;
        }
        
        await connection.execute(
          'UPDATE users SET username = ? WHERE id = ?',
          [newUsername, user.id]
        );
        
        console.log(`✅ 用户 ${user.id} 的username已更新为: ${newUsername}`);
      }
    }

    // 3. 检查其他可能的NULL值问题
    console.log('🔍 检查其他字段的NULL值...');
    
    // 修复email为NULL的情况
    const [nullEmails] = await connection.execute(
      'SELECT id, username FROM users WHERE email IS NULL OR email = ""'
    );
    
    if (nullEmails.length > 0) {
      console.log(`发现 ${nullEmails.length} 个用户的email为空，正在修复...`);
      for (let i = 0; i < nullEmails.length; i++) {
        const user = nullEmails[i];
        const newEmail = `${user.username || `user${i}`}@example.com`;
        
        await connection.execute(
          'UPDATE users SET email = ? WHERE id = ?',
          [newEmail, user.id]
        );
        
        console.log(`✅ 用户 ${user.id} 的email已更新为: ${newEmail}`);
      }
    }

    // 4. 修复role为NULL的情况
    await connection.execute(
      'UPDATE users SET role = "customer" WHERE role IS NULL'
    );

    // 5. 修复status为NULL的情况
    await connection.execute(
      'UPDATE users SET status = "active" WHERE status IS NULL'
    );

    // 6. 修复password为NULL的情况
    console.log('🔍 检查password字段的NULL值...');
    const [nullPasswords] = await connection.execute(
      'SELECT id, username FROM users WHERE password IS NULL OR password = ""'
    );
    
    if (nullPasswords.length > 0) {
      console.log(`发现 ${nullPasswords.length} 个用户的password为空，正在修复...`);
      const bcrypt = require('bcrypt');
      const defaultPassword = await bcrypt.hash('123456', 10); // 默认密码
      
      for (let i = 0; i < nullPasswords.length; i++) {
        const user = nullPasswords[i];
        
        await connection.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [defaultPassword, user.id]
        );
        
        console.log(`✅ 用户 ${user.username} 的password已设置默认值`);
      }
    }

    await connection.end();
    console.log('✅ 数据库修复完成！');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  fixDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { fixDatabase };