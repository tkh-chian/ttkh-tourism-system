// 修复数据库模型初始化问题
const { initializeModels, getModels } = require('./models');

async function fixModels() {
  try {
    console.log('🔧 开始修复数据库模型...');
    
    // 重新初始化模型
    await initializeModels();
    
    // 验证模型是否正确加载
    const { User, Product, Order, PriceSchedule, sequelize } = getModels();
    
    console.log('📊 模型状态检查:');
    console.log('  User模型:', User ? '✅ 已加载' : '❌ 未加载');
    console.log('  Product模型:', Product ? '✅ 已加载' : '❌ 未加载');
    console.log('  Order模型:', Order ? '✅ 已加载' : '❌ 未加载');
    console.log('  PriceSchedule模型:', PriceSchedule ? '✅ 已加载' : '❌ 未加载');
    console.log('  Sequelize实例:', sequelize ? '✅ 已连接' : '❌ 未连接');
    
    if (User) {
      // 测试User模型
      const userCount = await User.count();
      console.log(`👥 用户总数: ${userCount}`);
      
      if (userCount === 0) {
        console.log('🔄 创建测试用户...');
        
        const testUsers = [
          {
            username: 'admin',
            email: 'admin@ttkh.com',
            password_hash: 'admin123',
            role: 'admin',
            status: 'approved'
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
            status: 'approved'
          }
        ];
        
        for (const userData of testUsers) {
          try {
            const user = await User.create(userData);
            console.log(`✅ 创建用户: ${user.username}`);
          } catch (error) {
            console.log(`❌ 创建用户失败 ${userData.username}:`, error.message);
          }
        }
      }
      
      // 再次检查用户数量
      const finalUserCount = await User.count();
      console.log(`👥 最终用户总数: ${finalUserCount}`);
      
      // 列出所有用户
      const users = await User.findAll({
        attributes: ['username', 'email', 'role', 'status']
      });
      
      console.log('📋 用户列表:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
      });
    }
    
    console.log('🎉 模型修复完成！');
    
  } catch (error) {
    console.error('❌ 模型修复失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixModels().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { fixModels };