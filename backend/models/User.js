const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
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
      unique: true,
      validate: {
        isEmail: true
      }
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
      // 移除默认值，强制在创建用户时显式设置状态
      // 这样 authController.js 中的设置就不会被覆盖
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
    // 注意：我们不在模型中定义 createdAt 和 updatedAt 字段
    // 让数据库的默认值处理这些字段
  }, {
    tableName: 'users',
    timestamps: true, // 启用 Sequelize 自动管理时间戳
    // 确保 Sequelize 知道这些字段已经在数据库中有默认值
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (user) => {
        // 仅当密码不是已经哈希的字符串时才进行哈希，避免重复哈希
        if (user.password_hash && !/^\$2[aby]\$/.test(user.password_hash)) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash') && user.password_hash && !/^\$2[aby]\$/.test(user.password_hash)) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      }
    }
  });

  // 实例方法：验证密码
  User.prototype.validatePassword = async function(password) {
    // 如果模型中的password_hash为空，尝试直接从数据库获取密码
    if (!this.password_hash) {
      try {
        const conn = await require('mysql2/promise').createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'Lhjr@170103',
          database: process.env.DB_NAME || 'ttkh_tourism'
        });
        
        const [rows] = await conn.execute(
          'SELECT password FROM users WHERE id = ?', 
          [this.id]
        );
        
        await conn.end();
        
        if (rows && rows.length > 0 && rows[0].password) {
          return await bcrypt.compare(password, rows[0].password);
        }
        return false;
      } catch (error) {
        console.error('直接数据库密码验证出错:', error);
        return false;
      }
    }
    
    // 使用模型中的password_hash字段
    return await bcrypt.compare(password, this.password_hash);
  };

  // 实例方法：返回安全的用户对象（不包含密码）
  User.prototype.toSafeObject = function() {
    const { password_hash, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return User;
};