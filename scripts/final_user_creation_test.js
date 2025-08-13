/**
 * 最终用户创建测试脚本
 * 此脚本测试用户创建功能是否已修复
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 导入数据库配置
const { sequelize } = require('../backend/config/database');

// 导入用户模型并初始化
const UserModel = require('../backend/models/User');
const User = UserModel(sequelize);

// 启用SQL日志以便调试
sequelize.options.logging = console.log;

// 测试函数
async function testUserCreation() {
  try {
    console.log('开始测试用户创建功能...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 生成随机用户名和邮箱以避免冲突
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testUser = {
      username: `testuser${randomSuffix}`,
      email: `test${randomSuffix}@example.com`,
      password_hash: 'password123',
      phone: '1234567890',
      role: 'customer'
    };
    
    console.log('尝试创建用户:', testUser);
    
    // 创建用户
    const newUser = await User.create(testUser);
    
    console.log('用户创建成功!');
    console.log('用户ID:', newUser.id);
    console.log('用户名:', newUser.username);
    console.log('创建时间:', newUser.createdAt);
    console.log('更新时间:', newUser.updatedAt);
    
    // 验证时间戳字段
    if (newUser.createdAt && newUser.updatedAt) {
      console.log('✅ 时间戳字段正确设置');
    } else {
      console.log('❌ 时间戳字段未正确设置');
    }
    
    // 从数据库中查询用户以验证
    const foundUser = await User.findByPk(newUser.id);
    console.log('从数据库查询到的用户:');
    console.log('用户ID:', foundUser.id);
    console.log('用户名:', foundUser.username);
    console.log('创建时间:', foundUser.createdAt);
    console.log('更新时间:', foundUser.updatedAt);
    
    console.log('测试完成: 用户创建功能正常工作!');
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行测试
testUserCreation();

// 测试函数
async function testUserCreation() {
  try {
    console.log('开始测试用户创建功能...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 生成随机用户名和邮箱以避免冲突
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testUser = {
      username: `testuser${randomSuffix}`,
      email: `test${randomSuffix}@example.com`,
      password_hash: 'password123',
      phone: '1234567890',
      role: 'customer'
    };
    
    console.log('尝试创建用户:', testUser);
    
    // 创建用户
    const newUser = await User.create(testUser);
    
    console.log('用户创建成功!');
    console.log('用户ID:', newUser.id);
    console.log('用户名:', newUser.username);
    console.log('创建时间:', newUser.createdAt);
    console.log('更新时间:', newUser.updatedAt);
    
    // 验证时间戳字段
    if (newUser.createdAt && newUser.updatedAt) {
      console.log('✅ 时间戳字段正确设置');
    } else {
      console.log('❌ 时间戳字段未正确设置');
    }
    
    // 从数据库中查询用户以验证
    const foundUser = await User.findByPk(newUser.id);
    console.log('从数据库查询到的用户:');
    console.log('用户ID:', foundUser.id);
    console.log('用户名:', foundUser.username);
    console.log('创建时间:', foundUser.createdAt);
    console.log('更新时间:', foundUser.updatedAt);
    
    console.log('测试完成: 用户创建功能正常工作!');
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行测试
testUserCreation();