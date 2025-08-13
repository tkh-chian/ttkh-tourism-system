const mysql = require('mysql2/promise');

async function fixRoleField() {
  let connection;
  
  try {
    console.log('🔧 修复用户表role字段长度...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root123',
      database: 'ttkh_tourism'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 修改role字段长度
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'
    `);
    
    console.log('✅ role字段长度已修复为VARCHAR(20)');
    
    // 检查字段结构
    const [fields] = await connection.execute(`
      DESCRIBE users
    `);
    
    console.log('📋 用户表字段结构:');
    fields.forEach(field => {
      if (field.Field === 'role') {
        console.log(`   ${field.Field}: ${field.Type} (${field.Null === 'NO' ? '必填' : '可选'}) 默认值: ${field.Default}`);
      }
    });
    
    console.log('🎉 role字段修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixRoleField().catch(console.error);