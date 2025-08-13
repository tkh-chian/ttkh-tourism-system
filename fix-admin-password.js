const bcrypt = require('bcrypt');

(async () => {
  try {
    // 加载项目的模型初始化
    const modelsModule = require('./backend/models');
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

    const email = 'admin@ttkh.com';
    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);

    let user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('未找到 admin 用户:', email);
      process.exit(2);
    }

    await user.update({
      password_hash: hash,
      password: hash,
      status: user.status || 'active'
    });

    console.log('已更新 admin 密码为 admin123（已哈希）');
    process.exit(0);
  } catch (err) {
    console.error('操作失败:', err && err.stack ? err.stack : err);
    process.exit(3);
  }
})();