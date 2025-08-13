const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixRegistrationPasswordField() {
  console.log('🔧 修复注册时的password字段问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查users表的password字段
    console.log('\n🔍 检查password字段配置...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `);
    
    if (columns.length > 0) {
      const passwordCol = columns[0];
      console.log(`password字段: ${passwordCol.DATA_TYPE}, 可空: ${passwordCol.IS_NULLABLE}, 默认值: ${passwordCol.COLUMN_DEFAULT}`);
      
      // 2. 修改password字段为可空或设置默认值
      console.log('\n🔧 修改password字段为可空...');
      try {
        await connection.execute(`
          ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL
        `);
        console.log('✅ password字段已设置为可空');
      } catch (error) {
        console.log('⚠️ 修改password字段失败:', error.message);
      }
    } else {
      console.log('❌ 未找到password字段');
    }
    
    // 3. 测试注册功能
    console.log('\n🧪 测试注册功能...');
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3001';
    
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `testuser_${Date.now()}@test.com`,
      password: 'test123',
      role: 'customer'
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      
      if (response.data.success) {
        console.log('✅ 注册测试成功！');
        console.log(`   用户: ${testUser.email}`);
        
        // 立即测试登录
        try {
          const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
          });
          
          if (loginResponse.data.success && loginResponse.data.data.token) {
            console.log('✅ 登录测试也成功！');
            console.log('🎉 注册和登录功能都正常工作！');
          } else {
            console.log('❌ 登录测试失败');
          }
        } catch (loginError) {
          console.log('❌ 登录测试失败:', loginError.response?.data?.message || loginError.message);
        }
        
      } else {
        console.log('❌ 注册测试失败:', response.data.message);
      }
      
    } catch (error) {
      console.log('❌ 注册测试失败:', error.response?.data?.message || error.message);
      
      if (error.response?.data?.message?.includes('password')) {
        console.log('\n💡 这是password字段相关的错误，需要修复后端代码');
      }
    }
    
    console.log('\n📋 修复建议:');
    console.log('1. 确保后端注册API在插入用户时包含password字段');
    console.log('2. 或者将password字段设置为可空');
    console.log('3. 检查后端代码中的INSERT语句');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixRegistrationPasswordField().catch(console.error);