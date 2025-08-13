const { User } = require('./backend/models');
const { Op } = require('sequelize');

async function debugLoginDetailed() {
  try {
    console.log('🔍 详细调试登录问题...');
    
    // 测试查找用户的不同方式
    console.log('\n=== 测试1: 使用email查找 ===');
    const user1 = await User.findOne({
      where: { email: 'admin@ttkh.com' }
    });
    
    if (user1) {
      console.log('✅ 找到用户');
      console.log('📋 用户数据:', {
        id: user1.id,
        email: user1.email,
        password_hash: user1.password_hash ? '有密码' : '无密码',
        password_hash_length: user1.password_hash ? user1.password_hash.length : 0
      });
      
      // 检查原始数据值
      console.log('📋 原始数据值:', {
        password_hash: user1.dataValues.password_hash ? '有密码' : '无密码',
        password_hash_raw: user1.dataValues.password_hash
      });
    } else {
      console.log('❌ 未找到用户');
    }
    
    console.log('\n=== 测试2: 使用OR条件查找 ===');
    const user2 = await User.findOne({
      where: {
        [Op.or]: [
          { username: 'admin@ttkh.com' },
          { email: 'admin@ttkh.com' }
        ]
      }
    });
    
    if (user2) {
      console.log('✅ 找到用户');
      console.log('📋 用户数据:', {
        id: user2.id,
        email: user2.email,
        password_hash: user2.password_hash ? '有密码' : '无密码',
        password_hash_length: user2.password_hash ? user2.password_hash.length : 0
      });
      
      // 测试密码验证
      try {
        const isValid = await user2.validatePassword('admin123');
        console.log('✅ 密码验证结果:', isValid);
      } catch (err) {
        console.error('❌ 密码验证出错:', err.message);
      }
    } else {
      console.log('❌ 未找到用户');
    }
    
    console.log('\n=== 测试3: 直接SQL查询对比 ===');
    const [rawResults] = await User.sequelize.query(
      'SELECT id, username, email, password, role, status FROM users WHERE email = ?',
      { replacements: ['admin@ttkh.com'] }
    );
    
    if (rawResults && rawResults.length > 0) {
      const rawUser = rawResults[0];
      console.log('✅ 原始SQL查询结果:', {
        id: rawUser.id,
        email: rawUser.email,
        password: rawUser.password ? '有密码' : '无密码',
        password_length: rawUser.password ? rawUser.password.length : 0
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 调试出错:', error);
    process.exit(1);
  }
}

debugLoginDetailed();