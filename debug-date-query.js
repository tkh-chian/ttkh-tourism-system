const mysql = require('mysql2/promise');

async function debugDateQuery() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Lhjr@170103',
    database: 'ttkh_tourism'
  });
  
  try {
    const testDate = '2025-08-23';
    const productId = 5;
    
    console.log('🔍 调试日期查询逻辑');
    console.log('产品ID:', productId);
    console.log('查询日期:', testDate);
    console.log('');
    
    // 查看产品5的所有可用日期
    const [allDates] = await connection.execute(
      'SELECT travel_date, price, available_stock FROM price_schedules WHERE product_id = ? ORDER BY travel_date',
      [productId]
    );
    
    console.log('产品5的所有可用日期:');
    allDates.forEach((row, index) => {
      const dateStr = row.travel_date.toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${dateStr} | ¥${row.price} | 库存:${row.available_stock}`);
    });
    
    if (allDates.length === 0) {
      console.log('  ❌ 产品5没有任何价格日历设置');
      return;
    }
    
    // 使用第一个可用日期进行测试
    const firstDate = allDates[0];
    const availableDate = firstDate.travel_date.toISOString().split('T')[0];
    
    console.log(`\n🧪 使用可用日期进行测试: ${availableDate}`);
    
    // 方法1: DATE()函数匹配
    const [result1] = await connection.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND DATE(travel_date) = DATE(?)',
      [productId, availableDate]
    );
    console.log('方法1 - DATE()函数匹配:', result1.length, '条记录');
    
    // 方法2: 字符串匹配
    const [result2] = await connection.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND travel_date LIKE ?',
      [productId, availableDate + '%']
    );
    console.log('方法2 - 字符串匹配:', result2.length, '条记录');
    
    // 方法3: 精确匹配原始时间戳
    const [result3] = await connection.execute(
      'SELECT * FROM price_schedules WHERE product_id = ? AND travel_date = ?',
      [productId, firstDate.travel_date]
    );
    console.log('方法3 - 精确时间戳匹配:', result3.length, '条记录');
    
    if (result1.length > 0 || result2.length > 0 || result3.length > 0) {
      console.log('\n✅ 找到匹配的日期记录，日期查询逻辑正常');
      console.log('建议使用日期:', availableDate);
    } else {
      console.log('\n❌ 所有查询方法都失败，需要检查数据格式');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await connection.end();
  }
}

debugDateQuery();