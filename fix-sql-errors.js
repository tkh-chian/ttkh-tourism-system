const fs = require('fs');
const path = require('path');

// 读取mysql-backend-server.js文件
const serverFilePath = path.join(__dirname, 'mysql-backend-server.js');
let content = fs.readFileSync(serverFilePath, 'utf8');

console.log('🔧 开始修复SQL错误...');

// 修复所有包含category_id的SQL查询错误
const fixes = [
  // 修复1: 移除category_id字段引用
  {
    search: /LEFT JOIN categories c ON p\.category_id = c\.id/g,
    replace: ''
  },
  // 修复2: 移除category_name选择
  {
    search: /, c\.name as category_name/g,
    replace: ''
  },
  // 修复3: 修复INSERT语句中的category_id
  {
    search: /merchant_id, category_id, title_zh/g,
    replace: 'merchant_id, title_zh'
  },
  // 修复4: 修复VALUES中的category_id参数
  {
    search: /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/g,
    replace: 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  },
  // 修复5: 修复UPDATE语句中的category_id
  {
    search: /base_price = \?, category_id = \?, poster_image/g,
    replace: 'base_price = ?, poster_image'
  },
  // 修复6: 修复参数数组中的category_id
  {
    search: /category_id \|\| null,/g,
    replace: ''
  },
  // 修复7: 修复SELECT语句中缺少逗号的问题
  {
    search: /SELECT p\.\* u\.username as merchant_name/g,
    replace: 'SELECT p.*, u.username as merchant_name'
  }
];

// 应用所有修复
fixes.forEach((fix, index) => {
  const beforeCount = (content.match(fix.search) || []).length;
  content = content.replace(fix.search, fix.replace);
  const afterCount = (content.match(fix.search) || []).length;
  console.log(`✅ 修复 ${index + 1}: 替换了 ${beforeCount - afterCount} 处错误`);
});

// 写回文件
fs.writeFileSync(serverFilePath, content, 'utf8');

console.log('🎉 SQL错误修复完成！');
console.log('📝 修复内容：');
console.log('   - 移除了所有category_id字段引用');
console.log('   - 修复了SQL语法错误（缺少逗号）');
console.log('   - 调整了INSERT和UPDATE语句');
console.log('   - 移除了不存在的JOIN关联');

console.log('\n🚀 现在可以重新启动后端服务器了！');