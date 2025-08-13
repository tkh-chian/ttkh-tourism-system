const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixUsersDatetimeValues() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查是否有空字符串的时间戳
    console.log('📊 检查空时间戳值...');
    const [emptyCreatedAt] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE createdAt = ''");
    const [emptyUpdatedAt] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE updatedAt = ''");
    
    console.log(`发现 ${emptyCreatedAt[0].count} 条记录的 createdAt 为空字符串`);
    console.log(`发现 ${emptyUpdatedAt[0].count} 条记录的 updatedAt 为空字符串`);

    // 2. 临时禁用严格模式
    console.log('\n🔧 临时禁用严格模式...');
    await connection.execute("SET SESSION sql_mode=''");

    // 3. 使用 NULL 替换空字符串（这样可以触发默认值）
    console.log('\n🔄 修复空时间戳值...');
    
    // 先将空字符串设置为 NULL
    try {
      await connection.execute("UPDATE users SET createdAt = NULL WHERE createdAt = ''");
      console.log('✅ 已将空字符串的 createdAt 设置为 NULL');
    } catch (err) {
      console.error('❌ 更新 createdAt 值失败:', err.message);
    }
    
    try {
      await connection.execute("UPDATE users SET updatedAt = NULL WHERE updatedAt = ''");
      console.log('✅ 已将空字符串的 updatedAt 设置为 NULL');
    } catch (err) {
      console.error('❌ 更新 updatedAt 值失败:', err.message);
    }
    
    // 4. 再将 NULL 设置为当前时间
    try {
      await connection.execute("UPDATE users SET createdAt = NOW() WHERE createdAt IS NULL");
      console.log('✅ 已将 NULL 的 createdAt 设置为当前时间');
    } catch (err) {
      console.error('❌ 更新 createdAt 值失败:', err.message);
    }
    
    try {
      await connection.execute("UPDATE users SET updatedAt = NOW() WHERE updatedAt IS NULL");
      console.log('✅ 已将 NULL 的 updatedAt 设置为当前时间');
    } catch (err) {
      console.error('❌ 更新 updatedAt 值失败:', err.message);
    }
    
    // 5. 检查修复后的结果
    const [remainingEmptyCreatedAt] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE createdAt IS NULL OR createdAt = ''");
    const [remainingEmptyUpdatedAt] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE updatedAt IS NULL OR updatedAt = ''");
    
    console.log(`\n修复后，还有 ${remainingEmptyCreatedAt[0].count} 条记录的 createdAt 为空`);
    console.log(`修复后，还有 ${remainingEmptyUpdatedAt[0].count} 条记录的 updatedAt 为空`);
    
    // 6. 恢复 SQL 模式
    console.log('\n🔄 恢复原始 SQL 模式...');
    await connection.execute("SET SESSION sql_mode='IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    
    console.log('\n✅ users 表时间戳修复完成!');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行修复
fixUsersDatetimeValues();