/**
 * 重置customer账户密码脚本
 */

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// 数据库配置
const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false
};

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging
  }
);

async function resetCustomerPassword() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 要重置的用户信息
    const userEmail = 'customer@ttkh.com';
    const newPassword = 'customer123';

    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 执行SQL更新密码
    const [results] = await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, userEmail],
        type: Sequelize.QueryTypes.UPDATE
      }
    );

    if (results === 0) {
      console.log(`未找到用户: ${userEmail}`);
    } else {
      console.log(`成功重置用户 ${userEmail} 的密码`);
    }

    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');

  } catch (error) {
    console.error('重置密码时出错:', error);
  }
}

// 执行重置密码
resetCustomerPassword();