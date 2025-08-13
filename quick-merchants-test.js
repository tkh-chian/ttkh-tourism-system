const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 启动商家管理页面快速测试...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // 监听所有控制台输出
  page.on('console', msg => {
    console.log('🖥️  控制台:', msg.text());
  });
  
  // 监听网络请求
  page.on('response', response => {
    if (response.url().includes('/api/admin/merchants')) {
      console.log('🌐 API请求:', response.url(), '状态:', response.status());
    }
  });
  
  try {
    // 1. 登录管理员
    console.log('🔐 1. 登录管理员账号...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@ttkh.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 10000 });
    
    console.log('✅ 管理员登录成功');
    
    // 2. 导航到商家管理页面
    console.log('🏪 2. 导航到商家管理页面...');
    await page.goto('http://localhost:3000/admin/merchants');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待页面加载和API调用
    
    // 3. 检查页面元素
    console.log('📊 3. 检查页面数据...');
    
    // 检查统计卡片中的总数
    const totalCards = await page.$$eval('p.text-2xl.font-semibold.text-gray-900', elements => 
      elements.map(el => el.textContent)
    );
    console.log('📈 统计卡片数据:', totalCards);
    
    // 检查表格行数
    const tableRows = await page.$$eval('tbody tr', rows => rows.length);
    console.log('📋 表格行数:', tableRows);
    
    // 检查是否有"没有找到商家"的提示
    const noDataMessage = await page.$('h3');
    if (noDataMessage) {
      const messageText = await page.evaluate(el => el.textContent, noDataMessage);
      if (messageText.includes('没有找到商家') || messageText.includes('ไม่พบผู้ขาย')) {
        console.log('⚠️  显示"没有找到商家"消息');
      }
    }
    
    // 4. 检查localStorage中的token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('🔑 Token存在:', !!token);
    
    // 5. 手动触发API调用并检查响应
    console.log('🔧 4. 手动测试API调用...');
    const apiResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3001/api/admin/merchants', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        return {
          status: response.status,
          success: data.success,
          dataStructure: typeof data.data,
          hasUsers: !!(data.data && data.data.users),
          userCount: data.data && data.data.users ? data.data.users.length : 0,
          rawData: data
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📡 API响应分析:', apiResponse);
    
    if (apiResponse.status === 200 && apiResponse.hasUsers && apiResponse.userCount > 0) {
      console.log('✅ 测试成功！API返回了', apiResponse.userCount, '个商家用户');
      console.log('🎯 问题可能在前端数据处理逻辑');
      
      // 检查前端React状态
      const reactState = await page.evaluate(() => {
        // 尝试获取React组件的状态
        const merchantsElement = document.querySelector('[data-testid="merchants-table"]') || document.querySelector('tbody');
        if (merchantsElement) {
          return {
            hasTable: true,
            tableHTML: merchantsElement.innerHTML.substring(0, 200) + '...'
          };
        }
        return { hasTable: false };
      });
      
      console.log('⚛️  React状态检查:', reactState);
      
    } else if (apiResponse.status === 200 && apiResponse.userCount === 0) {
      console.log('⚠️  API调用成功但返回0个商家');
    } else {
      console.log('❌ API调用失败:', apiResponse);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  console.log('⏳ 保持浏览器打开10秒供检查...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
  console.log('🏁 测试完成');
})();