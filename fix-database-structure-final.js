const mysql = require('mysql2/promise');

async function fixDatabaseStructure() {
  console.log('🔧 修复数据库结构问题...');
  
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Flameaway3.',
      database: 'tourism_system'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查当前users表结构
    console.log('\n🔍 检查当前users表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'tourism_system' AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('当前字段:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // 2. 添加缺失的字段
    console.log('\n🔧 添加缺失的字段...');
    
    const fieldsToAdd = [
      { name: 'password_hash', type: 'VARCHAR(255)', nullable: true },
      { name: 'name', type: 'VARCHAR(100)', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        let sql = `ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`;
        if (field.nullable === false) {
          sql += ' NOT NULL';
        }
        if (field.default) {
          sql += ` DEFAULT ${field.default}`;
        }
        
        await connection.execute(sql);
        console.log(`✅ 添加字段: ${field.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ 字段已存在: ${field.name}`);
        } else {
          console.log(`❌ 添加字段失败 ${field.name}: ${error.message}`);
        }
      }
    }
    
    // 3. 修复现有数据
    console.log('\n🔄 修复现有数据...');
    
    // 将password复制到password_hash
    try {
      await connection.execute(`
        UPDATE users 
        SET password_hash = password 
        WHERE password_hash IS NULL AND password IS NOT NULL
      `);
      console.log('✅ 复制密码到password_hash字段');
    } catch (error) {
      console.log('⚠️ 密码复制失败:', error.message);
    }
    
    // 设置默认name值
    try {
      await connection.execute(`
        UPDATE users 
        SET name = CONCAT('用户_', username) 
        WHERE name IS NULL
      `);
      console.log('✅ 设置默认用户名');
    } catch (error) {
      console.log('⚠️ 用户名设置失败:', error.message);
    }
    
    // 4. 清理并重新创建测试用户
    console.log('\n🧹 清理并重新创建测试用户...');
    
    // 删除现有测试用户
    await connection.execute(`DELETE FROM users WHERE email LIKE '%test.com'`);
    console.log('✅ 清理旧测试用户');
    
    // 创建新的测试用户
    const testUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        password_hash: 'admin123',
        role: 'admin',
        name: '系统管理员',
        status: 'active'
      },
      {
        id: 2,
        username: 'testmerchant',
        email: 'merchant@test.com',
        password: 'merchant123',
        password_hash: 'merchant123',
        role: 'merchant',
        name: '测试商家',
        status: 'approved',
        company_name: '测试商家公司',
        contact_person: '测试联系人',
        phone: '02-123-4567'
      },
      {
        id: 3,
        username: 'testagent',
        email: 'agent@test.com',
        password: 'agent123',
        password_hash: 'agent123',
        role: 'agent',
        name: '测试代理',
        status: 'active'
      },
      {
        id: 4,
        username: 'testcustomer',
        email: 'customer@test.com',
        password: 'customer123',
        password_hash: 'customer123',
        role: 'customer',
        name: '测试客户',
        status: 'active'
      }
    ];
    
    for (const user of testUsers) {
      try {
        const fields = Object.keys(user).join(', ');
        const placeholders = Object.keys(user).map(() => '?').join(', ');
        const values = Object.values(user);
        
        await connection.execute(
          `INSERT INTO users (${fields}) VALUES (${placeholders})`,
          values
        );
        console.log(`✅ 创建用户: ${user.email}`);
      } catch (error) {
        console.log(`❌ 创建用户失败 ${user.email}: ${error.message}`);
      }
    }
    
    // 5. 验证修复结果
    console.log('\n✅ 验证修复结果...');
    
    const [users] = await connection.execute('SELECT id, username, email, role, status FROM users');
    console.log(`数据库中共有 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    console.log('\n🎉 数据库结构修复完成！');
    console.log('现在可以正常进行用户注册和登录了。');
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixDatabaseStructure().catch(console.error);