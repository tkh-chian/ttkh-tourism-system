const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixUsernameField() {
  console.log('🔧 修复username字段问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查username字段是否允许为空
    console.log('\n1️⃣ 检查username字段...');
    const [usersColumns] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'username'
    `);
    
    if (usersColumns.length > 0) {
      console.log(`username字段当前设置: ${usersColumns[0].Null === 'YES' ? '可为空' : '非空'}`);
      
      // 修改username字段为可为空
      if (usersColumns[0].Null === 'NO') {
        await connection.execute(`
          ALTER TABLE users MODIFY username varchar(255) NULL
        `);
        console.log('✅ 已将username字段修改为可为空');
      }
    }
    
    // 2. 修复未关联的订单
    console.log('\n2️⃣ 修复未关联的订单...');
    
    // 查找未关联客户的订单
    const [unlinkedOrders] = await connection.execute(`
      SELECT o.id, o.customer_name, o.customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.customer_id IS NULL OR u.id IS NULL
    `);
    
    if (unlinkedOrders.length > 0) {
      console.log(`\n发现 ${unlinkedOrders.length} 个未关联到客户的订单:`);
      
      for (const order of unlinkedOrders) {
        console.log(`  处理订单: ${order.id}, 客户: ${order.customer_name}, 邮箱: ${order.customer_email || '无邮箱'}`);
        
        // 如果没有邮箱，生成一个临时邮箱
        const email = order.customer_email || `temp_${order.id.substring(0, 8)}@example.com`;
        
        // 检查是否存在匹配的用户
        const [existingUsers] = await connection.execute(`
          SELECT id FROM users WHERE email = ?
        `, [email]);
        
        let customerId;
        
        if (existingUsers.length > 0) {
          customerId = existingUsers[0].id;
          console.log(`  ✅ 找到匹配的客户ID: ${customerId}`);
        } else {
          // 创建新客户
          const { v4: uuidv4 } = require('uuid');
          customerId = uuidv4();
          
          try {
            await connection.execute(`
              INSERT INTO users (
                id, email, role, status, name, created_at, updated_at
              ) VALUES (
                ?, ?, 'customer', 'active', ?, NOW(), NOW()
              )
            `, [customerId, email, order.customer_name || 'Guest']);
            
            console.log(`  ✅ 创建新客户ID: ${customerId}`);
          } catch (error) {
            console.log(`  ❌ 创建客户失败: ${error.message}`);
            continue; // 跳过这个订单
          }
        }
        
        // 更新订单关联
        try {
          await connection.execute(`
            UPDATE orders SET customer_id = ? WHERE id = ?
          `, [customerId, order.id]);
          
          console.log(`  ✅ 已更新订单${order.id}的客户ID为${customerId}`);
        } catch (error) {
          console.log(`  ❌ 更新订单失败: ${error.message}`);
        }
      }
    } else {
      console.log('✅ 所有订单都已关联到客户');
    }
    
    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    const [unlinkedOrdersAfter] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.customer_id IS NULL OR u.id IS NULL
    `);
    
    if (unlinkedOrdersAfter[0].count === 0) {
      console.log('✅ 订单客户关联修复成功');
    } else {
      console.log(`❌ 仍有 ${unlinkedOrdersAfter[0].count} 个订单未关联到有效客户`);
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复脚本
fixUsernameField().catch(console.error);