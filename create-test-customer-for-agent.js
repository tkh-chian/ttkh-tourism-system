const mysql = require('mysql2/promise');

// MySQL连接配置
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  port: 3306,
  database: 'ttkh_tourism'
};

async function createTestCustomerForAgent() {
  let connection;
  
  try {
    console.log('🔍 创建测试客户并关联到代理...\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');
    
    // 1. 获取代理用户
    console.log('\n📋 获取代理用户...');
    const [agents] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "agent" LIMIT 1'
    );
    
    if (agents.length === 0) {
      console.log('❌ 没有找到代理用户');
      return;
    }
    
    const agent = agents[0];
    console.log(`✅ 找到代理用户: ${agent.username} (ID: ${agent.id})`);
    
    // 2. 检查是否已有关联客户
    console.log('\n📋 检查是否已有关联客户...');
    const [existingCustomers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE agent_id = ? AND role = "user"',
      [agent.id]
    );
    
    if (existingCustomers.length > 0) {
      console.log(`✅ 已有 ${existingCustomers.length} 个关联客户:`);
      existingCustomers.forEach(customer => {
        console.log(`   - ${customer.username} (${customer.email})`);
      });
      return;
    }
    
    // 3. 创建测试客户
    console.log('\n📋 创建测试客户...');
    const customerUsername = `customer_${Date.now().toString().slice(-6)}`;
    const customerEmail = `${customerUsername}@test.com`;
    const passwordHash = '$2a$10$XvXWZ3Gy4SQGSm3Ry3oB8eVA.J5HRN1zQNdxvYGRnpX0nJ0KQUzLq'; // 明文密码: password123
    
    // 使用参数化查询，确保 agent_id 正确设置
    await connection.execute(
      'INSERT INTO users (id, username, email, password, role, status, agent_id, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [customerUsername, customerEmail, passwordHash, 'customer', 'active', agent.id]
    );
    
    console.log(`✅ 测试客户创建成功: ${customerUsername} (${customerEmail})`);
    console.log(`   关联到代理: ${agent.username} (${agent.id})`);
    
    // 4. 验证客户创建
    const [newCustomers] = await connection.execute(
      'SELECT id, username, email, agent_id FROM users WHERE username = ?',
      [customerUsername]
    );
    
    if (newCustomers.length > 0) {
      const customer = newCustomers[0];
      console.log('\n📋 验证客户信息:');
      console.log(`   ID: ${customer.id}`);
      console.log(`   用户名: ${customer.username}`);
      console.log(`   邮箱: ${customer.email}`);
      console.log(`   代理ID: ${customer.agent_id}`);
    }
    
  } catch (error) {
    console.error('❌ 创建测试客户过程中出现错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 数据库连接已关闭');
    }
  }
}

// 运行函数
createTestCustomerForAgent();