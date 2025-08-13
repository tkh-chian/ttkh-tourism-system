const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

(async () => {
  try {
    // 加载已初始化的 models 模块
    const modelsModule = require('./backend/models');
    if (typeof modelsModule.initializeModels === 'function') {
      await modelsModule.initializeModels();
    } else if (typeof modelsModule.init === 'function') {
      await modelsModule.init();
    }

    const sequelize = modelsModule.sequelize || (modelsModule.getModels && modelsModule.getModels().sequelize);
    if (!sequelize) {
      console.error('无法获取 sequelize 实例');
      process.exit(1);
    }

    const email = 'customer@test.com';
    const username = 'customer';
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO users (id, username, email, password, role, status, createdAt, updatedAt)
      VALUES (:id, :username, :email, :password, :role, :status, :createdAt, :updatedAt)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        password = VALUES(password),
        role = VALUES(role),
        status = VALUES(status),
        updatedAt = VALUES(updatedAt)
    `;

    await sequelize.query(sql, {
      replacements: {
        id,
        username,
        email,
        password: hash,
        role: 'customer',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    });

    console.log('已创建或更新用户:', email);
    process.exit(0);
  } catch (err) {
    console.error('操作失败:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();