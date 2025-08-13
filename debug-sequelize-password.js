const { User } = require('./backend/models');

async function debugSequelizePassword() {
  try {
    console.log('🔍 调试Sequelize密码字段加载问题...');
    
    // 查找admin用户
    const user = await User.findOne({
      where: { email: 'admin@ttkh.com' }
    });
    
    if (user) {
      console.log('✅ 找到用户:', user.email);
      console.log('📋 用户原始数据:', user.dataValues);
      console.log('🔑 password_hash字段:', user.password_hash);
      console.log('🔑 password字段:', user.dataValues.password);
      console.log('🔑 getDataValue(password_hash):', user.getDataValue('password_hash'));
      console.log('🔑 get(password_hash):', user.get('password_hash'));
      
      // 测试密码验证
      try {
        const isValid = await user.validatePassword('admin123');
        console.log('✅ 密码验证结果:', isValid);
      } catch (err) {
        console.error('❌ 密码验证出错:', err.message);
      }
    } else {
      console.log('❌ 未找到admin用户');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 调试出错:', error);
    process.exit(1);
  }
}

debugSequelizePassword();