const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 导入模型
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
const PriceSchedule = require('./PriceSchedule')(sequelize);

// 定义关联关系
User.hasMany(Product, { foreignKey: 'merchant_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'merchant_id', as: 'merchant' });

// 根据数据库实际结构定义关联关系
User.hasMany(Order, { foreignKey: 'customer_id', as: 'customerOrders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Order, { foreignKey: 'merchant_id', as: 'merchantOrders' });
Order.belongsTo(User, { foreignKey: 'merchant_id', as: 'merchant' });

User.hasMany(Order, { foreignKey: 'agent_id', as: 'agentOrders' });
Order.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(PriceSchedule, { foreignKey: 'product_id', as: 'schedules' });
PriceSchedule.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 初始化数据库
const initializeModels = async () => {
  try {
    console.log('🔄 正在连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('🔄 正在同步数据库模型...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('DROP TABLE IF EXISTS cart');
    await sequelize.query('DROP TABLE IF EXISTS carts');
    await sequelize.query('DROP TABLE IF EXISTS order_items');
    // 使用 alter 进行非破坏性同步，避免在开发服务器或重启时重置数据或覆盖用户状态
    await sequelize.sync({ alter: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ 数据库模型同步完成');

    // 创建默认用户
    await createDefaultUsers();
    // 注意：不再自动将所有商家状态强制设为 active，避免覆盖待审核商家的状态
    // await User.update({ status: 'active' }, { where: { role: 'merchant' } });

    // 创建默认商品及价格日程
    const merchantUser = await User.findOne({ where: { username: 'merchant' } });
    
    if (!merchantUser) {
      console.log('⚠️ 未找到merchant用户，跳过创建默认产品');
      return true;
    }
    
    // 检查默认产品是否已存在
    let defaultProduct = await Product.findOne({ where: { product_number: 'PRD-00001' } });
    
    if (!defaultProduct) {
      defaultProduct = await Product.create({
        product_number: 'PRD-00001',
        merchant_id: merchantUser.id,
        title_zh: '测试产品',
        title_th: 'ทดสอบผลิตภัณฑ์',
        description_zh: '仅用于测试',
        description_th: 'สำหรับการทดสอบเท่านั้น',
        base_price: 100,
        name: '测试产品',
        description: '仅用于测试',
        price: 100,
        status: 'approved'
      });
      console.log('✅ 创建默认产品成功');
    } else {
      console.log('🔄 默认产品已存在，无需创建');
    }
    
    // 创建价格日程
    if (defaultProduct) {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1);
      const dateStr = scheduleDate.toISOString().split('T')[0];
      
      // 检查价格日程是否已存在
      const existingSchedule = await PriceSchedule.findOne({
        where: {
          product_id: defaultProduct.id,
          date: dateStr
        }
      });
      
      if (!existingSchedule) {
        await PriceSchedule.create({
          product_id: defaultProduct.id,
          date: dateStr,
          price: 100,
          available_slots: 20
        });
        console.log('✅ 创建默认价格日程成功');
      } else {
        console.log('🔄 默认价格日程已存在，无需创建');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 创建默认用户
const createDefaultUsers = async () => {
  try {
    const bcrypt = require('bcrypt');
    
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@ttkh.com',
        plainPassword: 'admin123',
        role: 'admin',
        status: 'active'
      },
      {
        username: 'merchant',
        email: 'merchant@ttkh.com',
        plainPassword: 'merchant123',
        role: 'merchant',
        status: 'active',
        company_name: '测试商家',
        contact_person: '商家联系人'
      },
      {
        username: 'agent',
        email: 'agent@ttkh.com',
        plainPassword: 'agent123',
        role: 'agent',
        status: 'active'
      },
      {
        username: 'customer',
        email: 'customer@ttkh.com',
        plainPassword: '123456',
        role: 'customer',
        status: 'active'
      },
      // 兼容测试脚本使用的客户邮箱（test 使用 customer@test.com）
      {
        username: 'customer_test',
        email: 'customer@test.com',
        plainPassword: '123456',
        role: 'customer',
        status: 'active'
      }
    ];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      const hash = await bcrypt.hash(userData.plainPassword, 10);
      const payload = {
        username: userData.username,
        email: userData.email,
        password_hash: hash,
        password: hash,
        role: userData.role,
        status: userData.status,
        company_name: userData.company_name || null,
        contact_person: userData.contact_person || null
      };

      if (!existingUser) {
        await User.create(payload);
        console.log(`✅ 创建默认用户: ${userData.username}`);
      } else {
        // 只更新密码和状态，不更新用户名避免重复错误
        await existingUser.update({
          password_hash: payload.password_hash,
          password: payload.password,
          status: payload.status,
          company_name: payload.company_name,
          contact_person: payload.contact_person
        });
        console.log(`🔄 已更新默认用户: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error('❌ 创建默认用户失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  PriceSchedule,
  initializeModels
};