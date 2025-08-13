const bcrypt = require('bcrypt');
(async () => {
  try {
    const modelsModule = require('./backend/models');
    if (typeof modelsModule.initializeModels === 'function') {
      await modelsModule.initializeModels();
    } else if (typeof modelsModule.init === 'function') {
      await modelsModule.init();
    }
    const User = modelsModule.User || (modelsModule.getModels && modelsModule.getModels().User);
    if (!User) {
      console.error('ERR: 无法获取 User 模型');
      process.exit(2);
    }
    const email = 'customer@test.com';
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('NOT_FOUND');
      process.exit(0);
    }
    const raw = user.get ? user.get() : user;
    const hasPassword = raw.password || raw.password_hash || null;
    const preview = hasPassword ? (typeof hasPassword === 'string' ? hasPassword.slice(0, 60) : String(hasPassword)) : null;
    console.log('FOUND');
    console.log('id:', raw.id);
    console.log('email:', raw.email);
    console.log('username:', raw.username);
    console.log('role:', raw.role);
    console.log('status:', raw.status);
    console.log('password_field_present:', !!hasPassword);
    console.log('password_preview:', preview);
    if (hasPassword) {
      const match = await bcrypt.compare('123456', hasPassword);
      console.log('password_match_with_123456:', match);
    }
    process.exit(0);
  } catch (err) {
    console.error('ERR:', err && err.stack ? err.stack : err);
    process.exit(3);
  }
})();