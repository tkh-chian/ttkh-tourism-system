const bcrypt = require('bcrypt');
(async () => {
  try {
    const modelsModule = require('./backend/models');
    // 初始化模型（若有该函数）
    if (typeof modelsModule.initializeModels === 'function') {
      await modelsModule.initializeModels();
    } else if (typeof modelsModule.init === 'function') {
      await modelsModule.init();
    }
    const User = modelsModule.User || (modelsModule.getModels && modelsModule.getModels().User);
    if (!User) {
      console.error('无法获取 User 模型');
      process.exit(1);
    }

    const email = 'customer@test.com';
    const username = 'customer';
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);

    let user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({
        username,
        // 兼容不同字段映射，尽量同时更新两种命名
        password_hash: hash,
        password: hash,
        role: 'customer',
        status: 'active'
      });
      console.log('已更新现有用户:', email);
    } else {
      await User.create({
        username,
        email,
        password_hash: hash,
        password: hash,
        role: 'customer',
        status: 'active'
      });
      console.log('已创建用户:', email);
    }
    process.exit(0);
  } catch (err) {
    console.error('操作失败:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();