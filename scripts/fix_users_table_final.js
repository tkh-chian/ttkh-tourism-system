const { Sequelize } = require('sequelize');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism',
  dialect: 'mysql'
};

async function fixUsersTable() {
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

    // 检查MySQL的SQL模式
    console.log('\n🔍 检查MySQL的SQL模式...');
    const [sqlModeResult] = await sequelize.query("SELECT @@sql_mode");
    console.log('当前SQL模式:', sqlModeResult[0]['@@sql_mode']);

    // 临时禁用严格模式
    console.log('\n🔧 临时禁用严格模式...');
    await sequelize.query("SET SESSION sql_mode = ''");
    console.log('✅ 已临时禁用严格模式');

    // 检查users表结构
    console.log('\n📊 检查users表结构...');
    const [tableInfo] = await sequelize.query("DESCRIBE users");
    console.log('表结构:', JSON.stringify(tableInfo, null, 2));

    // 修复时间戳字段
    console.log('\n🔧 修复时间戳字段...');
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      MODIFY COLUMN updatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ 时间戳字段已修复为可为空且有默认值');

    // 创建一个测试用户，验证修复是否成功
    console.log('\n👤 创建测试用户验证修复...');
    
    // 使用原生SQL插入，不指定createdAt和updatedAt，让它们使用默认值
    await sequelize.query(`
      INSERT INTO users (
        id, 
        username, 
        email, 
        password, 
        role, 
        status, 
        name
      ) VALUES (
        UUID(), 
        'test_fix_final', 
        'test_final@example.com', 
        '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 
        'customer', 
        'active', 
        '最终修复测试用户'
      )
    `);
    
    console.log('✅ 测试用户创建成功');

    // 查询创建的用户，验证时间戳是否正确设置
    console.log('\n🔍 验证创建的用户...');
    const [users] = await sequelize.query(`
      SELECT id, username, email, role, createdAt, updatedAt 
      FROM users 
      WHERE username = 'test_fix_final'
    `);

    console.log('📋 创建的测试用户:', JSON.stringify(users, null, 2));

    // 修改User模型文件
    console.log('\n📝 更新User模型建议:');
    console.log(`
    1. 确保User.js中的时间戳字段定义与数据库一致:
       createdAt: {
         type: DataTypes.DATE,
         allowNull: true,
         defaultValue: DataTypes.NOW
       },
       updatedAt: {
         type: DataTypes.DATE,
         allowNull: true,
         defaultValue: DataTypes.NOW
       }
    
    2. 设置timestamps: false，手动管理时间戳
    
    3. 在beforeCreate钩子中不要手动设置时间戳，让数据库默认值处理
    `);

    console.log('\n✅ users表修复完成!');

  } catch (error) {
    console.error('❌ 过程中发生错误:', error.message);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行修复
fixUsersTable();