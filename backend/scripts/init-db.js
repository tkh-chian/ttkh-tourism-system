const { syncDatabase } = require('../models');

// 数据库初始化脚本
const initDatabase = async () => {
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 强制重建所有表
    await syncDatabase(true);
    
    console.log('✅ 数据库初始化完成！');
    console.log('📝 默认管理员账户已创建：');
    console.log('   用户名: admin');
    console.log('   密码: admin123');
    console.log('   邮箱: admin@ttkh.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

initDatabase();