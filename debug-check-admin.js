const { sequelize } = require('./backend/config/database');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    console.log('🔍 检查数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 已连接到数据库');

    const email = 'admin@ttkh.com';
    console.log(`🔎 查询用户: ${email}`);

    const rows = await sequelize.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      { replacements: [email], type: QueryTypes.SELECT }
    );

    if (!rows || rows.length === 0) {
      console.log('❌ 未找到 admin 用户（admin@ttkh.com）');
      process.exit(2);
    }

    const user = rows[0];

    // 检测可能的密码列
    const hashed = user.password || user.password_hash || user.passwordHash || user.passwd;
    console.log('📋 用户记录keys:', Object.keys(user));
    console.log('📋 用户摘要:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      password_column_present: !!user.password,
      password_hash_column_present: !!user.password_hash,
      password_preview: (hashed || '').slice(0, 30) + ((hashed && hashed.length > 30) ? '...' : '')
    });

    if (!hashed) {
      console.log('❌ 未找到可用于验证的密码列（尝试过 password / password_hash / passwordHash / passwd）');
      process.exit(4);
    }

    const plain = 'admin123';
    console.log('🔐 验证密码 admin123 是否与数据库哈希匹配...');
    const match = await bcrypt.compare(plain, hashed);
    console.log('🔓 密码比对结果:', match);

    process.exit(match ? 0 : 3);
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error && error.message ? error.message : error);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch(e) {}
  }
})();