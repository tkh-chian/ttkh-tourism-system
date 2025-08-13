/**
 * 数据库初始化脚本 - 用于Render.com部署
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 获取数据库连接URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ 错误: 未找到DATABASE_URL环境变量');
  process.exit(1);
}

console.log('🔄 正在连接到数据库...');

// 创建Sequelize实例
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

// 加载模型
const modelsDir = path.join(__dirname, 'models');
const modelFiles = fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js');

console.log(`📂 找到 ${modelFiles.length} 个模型文件`);

// 导入所有模型
const models = {};
modelFiles.forEach(file => {
  try {
    const model = require(path.join(modelsDir, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
    console.log(`✅ 已加载模型: ${model.name}`);
  } catch (error) {
    console.error(`❌ 加载模型 ${file} 失败:`, error);
  }
});

// 设置模型关联
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
    console.log(`🔗 已设置 ${modelName} 的关联`);
  }
});

// 同步数据库
async function syncDatabase() {
  try {
    console.log('🔄 正在同步数据库结构...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步所有模型
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库同步完成');
    
    // 添加初始数据
    await createInitialData();
    
    console.log('✅ 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    process.exit(1);
  }
}

// 创建初始数据
async function createInitialData() {
  try {
    console.log('🔄 正在创建初始数据...');
    
    // 检查是否已有管理员用户
    const User = models.User;
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      // 创建管理员用户
      await User.create({
        name: 'Admin',
        email: 'admin@ttkh.com',
        password: 'admin123', // 会自动哈希
        role: 'admin'
      });
      console.log('✅ 已创建管理员用户');
    }
    
    // 检查是否已有商家用户
    const merchantExists = await User.findOne({ where: { role: 'merchant' } });
    
    if (!merchantExists) {
      // 创建商家用户
      await User.create({
        name: 'Merchant',
        email: 'merchant@ttkh.com',
        password: 'merchant123', // 会自动哈希
        role: 'merchant'
      });
      console.log('✅ 已创建商家用户');
    }
    
    // 检查是否已有客户用户
    const customerExists = await User.findOne({ where: { email: 'customer@ttkh.com' } });
    
    if (!customerExists) {
      // 创建客户用户
      await User.create({
        name: 'Customer',
        email: 'customer@ttkh.com',
        password: 'customer123', // 会自动哈希
        role: 'customer'
      });
      console.log('✅ 已创建客户用户');
    }
    
    console.log('✅ 初始数据创建完成');
  } catch (error) {
    console.error('❌ 创建初始数据失败:', error);
    throw error;
  }
}

// 执行数据库同步
syncDatabase();