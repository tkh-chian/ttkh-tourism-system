const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');

async function createTestUsers() {
  let sequelize;
  
  try {
    // 直接连接SQLite数据库
    const dbPath = path.join(__dirname, 'database.sqlite');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false
    });

    console.log('✅ 数据库连接成功');

    // 定义User模型
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('customer', 'merchant', 'agent', 'admin'),
        defaultValue: 'customer'
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
        defaultValue: 'pending'
      },
      company_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      contact_person: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    }, {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });

    // 密码加密钩子
    User.beforeCreate(async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    });

    // 同步数据库
    await sequelize.sync();
    
    // 检查现有用户
    const existingUsers = await User.findAll();
    console.log(`📊 当前用户数量: ${existingUsers.length}`);
    
    // 创建测试用户
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@ttkh.com',
        password_hash: 'admin123',
        role: 'admin',
        status: 'approved',
        contact_person: '系统管理员'
      },
      {
        username: 'merchant',
        email: 'merchant@ttkh.com',
        password_hash: 'merchant123',
        role: 'merchant',
        status: 'approved',
        company_name: '测试商家',
        contact_person: '商家联系人'
      },
      {
        username: 'agent',
        email: 'agent@ttkh.com',
        password_hash: 'agent123',
        role: 'agent',
        status: 'approved',
        company_name: '测试代理',
        contact_person: '代理联系人'
      },
      {
        username: 'customer',
        email: 'customer@ttkh.com',
        password_hash: 'customer123',
        role: 'customer',
        status: 'approved',
        contact_person: '测试用户'
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({
          where: {
            [Sequelize.Op.or]: [
              { username: userData.username },
              { email: userData.email }
            ]
          }
        });

        if (!existingUser) {
          await User.create(userData);
          console.log(`✅ 创建用户: ${userData.username} (${userData.role})`);
        } else {
          console.log(`⚠️  用户已存在: ${userData.username}`);
        }
      } catch (error) {
        console.error(`❌ 创建用户失败 ${userData.username}:`, error.message);
      }
    }

    // 显示所有用户
    const allUsers = await User.findAll({
      attributes: ['username', 'email', 'role', 'status']
    });
    
    console.log('\n📋 所有用户列表:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
    });

    console.log('\n🎉 测试用户创建完成！');
    console.log('\n🔑 登录信息:');
    console.log('  管理员: admin / admin123');
    console.log('  商家: merchant / merchant123');
    console.log('  代理: agent / agent123');
    console.log('  用户: customer / customer123');
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

createTestUsers();