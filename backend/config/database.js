const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false, // 关闭SQL日志
  timezone: '+07:00',
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ttkh_tourism',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Lhjr@170103',
  dbConfig
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 如果是访问被拒绝错误，提供解决方案
    if (error.original && error.original.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 解决方案:');
      console.log('   1. 检查MySQL服务是否启动');
      console.log('   2. 检查用户名和密码是否正确');
      console.log('   3. 如果没有密码，请在.env文件中设置 DB_PASSWORD=');
      console.log('   4. 或者创建MySQL用户: CREATE USER \'root\'@\'localhost\' IDENTIFIED BY \'\';');
    }
    
    return false;
  }
};

module.exports = { sequelize, testConnection };