const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.get('http://localhost:3001/api/products?status=approved');
    
    console.log('=== API响应详细分析 ===');
    console.log('HTTP状态:', response.status);
    console.log('完整响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n=== 数据结构分析 ===');
    console.log('success字段:', response.data.success);
    console.log('data字段类型:', typeof response.data.data);
    console.log('data是否为数组:', Array.isArray(response.data.data));
    
    if (response.data.data && typeof response.data.data === 'object') {
      console.log('data对象的键:', Object.keys(response.data.data));
      if (response.data.data.rows) {
        console.log('rows字段存在，类型:', typeof response.data.data.rows);
        console.log('rows是否为数组:', Array.isArray(response.data.data.rows));
        if (Array.isArray(response.data.data.rows)) {
          console.log('rows数组长度:', response.data.data.rows.length);
        }
      }
    }
  } catch (error) {
    console.error('请求错误:', error.response ? error.response.data : error.message);
  }
}

testAPI();