const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism',
  dialect: 'mysql'
};

async function testUserCreation() {
  // 创建 Sequelize 实例
  const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  });

  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 定义用户模型（与 backend/models/User.js 保持一致）
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password'
      },
      role: {
        type: DataTypes.ENUM('admin', 'merchant', 'agent', 'customer'),
        allowNull: false,
        defaultValue: 'customer'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'pending', 'approved', 'rejected', 'suspended'),
        allowNull: false,
        defaultValue: 'active'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      contact_person: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'users',
      timestamps: false // 禁用 Sequelize 自动管理时间戳
    });

    // 清空表
    console.log('\n🗑️ 清空 users 表...');
    await User.destroy({ where: {} });
    console.log('✅ users 表已清空');

    // 创建测试用户
    console.log('\n👤 创建测试用户...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date(); // 当前时间

    const testUsers = [
      { 
        username: 'admin_test', 
        email: 'admin_test@example.com', 
        password_hash: hashedPassword, 
        role: 'admin', 
        status: 'active',
        name: '测试管理员',
        createdAt: now,
        updatedAt: now
      },
      { 
        username: 'merchant_test', 
        email: 'merchant_test@example.com', 
        password_hash: hashedPassword, 
        role: 'merchant', 
        status: 'active',
        name: '测试商家',
        createdAt: now,
        updatedAt: now
      },
      { 
        username: 'customer_test', 
        email: 'customer_test@example.com', 
        password_hash: hashedPassword, 
        role: 'customer', 
        status: 'active',
        name: '测试客户',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const userData of testUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✅ 创建用户: ${userData.email} (${userData.role}), ID: ${user.id}`);
      } catch (err) {
        console.error(`❌ 创建用户 ${userData.email} 失败:`, err.message);
      }
    }

    // 验证用户创建
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt']
    });

    console.log('\n📋 创建的用户:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ID=${user.id}, 创建时间=${user.createdAt}, 更新时间=${user.updatedAt}`);
    });

    console.log('\n✅ 用户创建完成!');

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行测试
testUserCreation();