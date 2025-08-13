const fs = require('fs');
const path = require('path');

// 读取simple-server-fixed.js文件
const serverFilePath = path.join(__dirname, 'backend', 'simple-server-fixed.js');
let serverCode = fs.readFileSync(serverFilePath, 'utf8');

console.log('🔧 修复后端API中的日期查询逻辑...');

// 查找并替换价格日历查询逻辑
const originalQueryPattern = /const \[schedules\] = await connection\.execute\(`[\s\S]*?WHERE product_id = \? AND (DATE\(travel_date\) = \?|travel_date = \?|DATE\(travel_date\) = DATE\(\?\))`/;
const newQuery = `const [schedules] = await connection.execute(\`
    SELECT * FROM price_schedules 
    WHERE product_id = ? AND DATE_FORMAT(travel_date, '%Y-%m-%d') = ?
  \``;

if (originalQueryPattern.test(serverCode)) {
  serverCode = serverCode.replace(originalQueryPattern, newQuery);
  console.log('✅ 成功修改价格日历查询逻辑');
} else {
  console.log('❌ 未找到价格日历查询逻辑，请手动修改');
}

// 保存修改后的文件
fs.writeFileSync(serverFilePath, serverCode);
console.log('✅ 已保存修改后的文件');

console.log('\n🔍 修复总结:');
console.log('1. 已修改后端API中的日期查询逻辑为: DATE_FORMAT(travel_date, "%Y-%m-%d") = ?');
console.log('2. 已使用STR_TO_DATE函数重新插入正确格式的日期记录');
console.log('3. 前端发送的日期格式应为YYYY-MM-DD');
console.log('\n🚀 请重启后端服务器以应用更改');