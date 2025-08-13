const http = require('http');

function testSchedulesAPI() {
  console.log('测试产品价格日历API...');
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/products/1/schedules',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('API响应状态:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('API响应数据:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.success && jsonData.data && jsonData.data.schedules) {
          console.log('\n价格日历数据:');
          jsonData.data.schedules.forEach((schedule, index) => {
            console.log(`${index + 1}. 日期: ${schedule.travel_date}`);
            console.log(`   价格: ¥${schedule.price}`);
            console.log(`   总库存: ${schedule.total_stock}`);
            console.log(`   可用库存: ${schedule.available_stock}`);
            console.log('---');
          });
        } else {
          console.log('没有找到价格日历数据');
        }
      } catch (error) {
        console.error('解析JSON失败:', error.message);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求失败:', error.message);
  });

  req.end();
}

testSchedulesAPI();
