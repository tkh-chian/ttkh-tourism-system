const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const models = require('../backend/models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    console.log('尝试通过 Sequelize 创建测试用户...');
    await models.sequelize.authenticate();
    console.log('Sequelize 连接成功');
    // 临时清空当前会话的 sql_mode，避免严格模式导致的 DATETIME 格式拒绝
    await models.sequelize.query("SET SESSION sql_mode = ''");
    console.log('已清空 session sql_mode');

    const id = uuidv4();
    const username = `testuser_${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@example.com`;
    const passwordHash = bcrypt.hashSync('password123', 10);

    const userData = {
      id,
      username,
      email,
      password_hash: passwordHash,
      role: 'customer',
      status: 'active',
      phone: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const user = await models.User.create(userData, { fields: ['id', 'username', 'email', 'password_hash', 'role', 'status', 'phone'] });
    console.log('Sequelize 创建结果 (toJSON):', user.toJSON());
    console.log('测试完成：用户已创建。');
  } catch (err) {
    console.error('Sequelize 操作失败:', err);
  } finally {
    try { await models.sequelize.close(); } catch (e) {}
  }
}

run();