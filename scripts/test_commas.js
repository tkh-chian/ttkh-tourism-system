const util = require('util');

console.log('=== comma test start ===');

// diagnostic info
try {
  console.log('process.execArgv:', process.execArgv);
  console.log('process.env.NODE_OPTIONS:', process.env.NODE_OPTIONS);
  console.log('require.main.filename:', require.main && require.main.filename);
  const loaded = Object.keys(require.cache || {});
  console.log('require.cache keys (first 100):', loaded.slice(0, 100));
} catch (e) {
  console.error('diagnostic error:', e);
}

console.log('测试：直接字符串包含逗号 ->', 'a,b,c');
console.log('测试：join 产生的逗号 ->', ['a','b','c'].join(','));
console.log('测试：SQL 字符串 ->', 'INSERT INTO users (id, username, email) VALUES (?, ?, ?)');
console.log('测试：JSON stringify ->', JSON.stringify({id: 1, username: 'u', email: 'e@example.com'}));
console.log('测试：util.format ->', util.format('cols: %s', ['id','username','email'].join(', ')));
process.stdout.write('测试：direct stdout write -> a,b,c\n');

console.log('=== comma test end ===');