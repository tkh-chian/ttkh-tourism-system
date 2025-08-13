const mysql = require('mysql2/promise');

async function fixDuplicateUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });

  try {
    console.log('🔧 修复重复用户数据...');

    // 1. 查看重复的用户名
    const [duplicates] = await connection.execute(`
      SELECT username, COUNT(*) as count 
      FROM users 
      GROUP BY username 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.log('📋 发现重复用户名:', duplicates);

      // 2. 对每个重复的用户名，保留最新的记录，删除其他的
      for (const duplicate of duplicates) {
        const username = duplicate.username;
        console.log(`🔄 处理重复用户名: ${username}`);

        // 获取该用户名的所有记录，按ID排序
        const [userRecords] = await connection.execute(`
          SELECT id, username, email, role, created_at 
          FROM users 
          WHERE username = ? 
          ORDER BY id DESC
        `, [username]);

        if (userRecords.length > 1) {
          // 保留第一条（最新的），删除其他的
          const keepRecord = userRecords[0];
          const deleteRecords = userRecords.slice(1);

          console.log(`✅ 保留记录 ID: ${keepRecord.id}, 用户名: ${keepRecord.username}`);

          for (const record of deleteRecords) {
            await connection.execute('DELETE FROM users WHERE id = ?', [record.id]);
            console.log(`❌ 删除重复记录 ID: ${record.id}`);
          }
        }
      }
    } else {
      console.log('ℹ️ 没有发现重复的用户名');
    }

    // 3. 检查邮箱重复
    const [emailDuplicates] = await connection.execute(`
      SELECT email, COUNT(*) as count 
      FROM users 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);

    if (emailDuplicates.length > 0) {
      console.log('📋 发现重复邮箱:', emailDuplicates);

      for (const duplicate of emailDuplicates) {
        const email = duplicate.email;
        console.log(`🔄 处理重复邮箱: ${email}`);

        const [emailRecords] = await connection.execute(`
          SELECT id, username, email, role, created_at 
          FROM users 
          WHERE email = ? 
          ORDER BY id DESC
        `, [email]);

        if (emailRecords.length > 1) {
          const keepRecord = emailRecords[0];
          const deleteRecords = emailRecords.slice(1);

          console.log(`✅ 保留邮箱记录 ID: ${keepRecord.id}, 邮箱: ${keepRecord.email}`);

          for (const record of deleteRecords) {
            await connection.execute('DELETE FROM users WHERE id = ?', [record.id]);
            console.log(`❌ 删除重复邮箱记录 ID: ${record.id}`);
          }
        }
      }
    } else {
      console.log('ℹ️ 没有发现重复的邮箱');
    }

    // 4. 显示清理后的用户列表
    const [finalUsers] = await connection.execute(`
      SELECT id, username, email, role, created_at 
      FROM users 
      ORDER BY id
    `);

    console.log('📋 清理后的用户列表:');
    finalUsers.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}`);
    });

    console.log('🎉 重复用户数据清理完成！');

  } catch (error) {
    console.error('❌ 清理过程中出错:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  fixDuplicateUsers()
    .then(() => {
      console.log('✅ 清理完成，现在可以重新启动后端服务');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 清理失败:', error);
      process.exit(1);
    });
}

module.exports = { fixDuplicateUsers };