const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism',
  dialect: 'mysql'
};

async function createUsersWithSequelize() {
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

    // 定义 User 模型
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
      password: {
        type: DataTypes.STRING,
        allowNull: false
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
      }
    }, {
      tableName: 'users',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    });

    // 清空表
    console.log('\n🗑️ 清空 users 表...');
    await User.destroy({ where: {} });
    console.log('✅ users 表已清空');

    // 创建测试用户
    console.log('\n👤 创建测试用户...');
    const hashedPassword = '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsWB5WUBJKd5xbdHFYWJHn1EGQXcC'; // 预先哈希的密码

    const testUsers = [
      { username: 'admin', email: 'admin@test.com', password: hashedPassword, role: 'admin', name: '管理员', status: 'active' },
      { username: 'merchant', email: 'merchant@test.com', password: hashedPassword, role: 'merchant', name: '商家用户', status: 'active' },
      { username: 'user', email: 'user@test.com', password: hashedPassword, role: 'customer', name: '普通用户', status: 'active' }
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

// 执行创建用户
createUsersWithSequelize();