const puppeteer = require('puppeteer');

async function testAdminMerchantsPage() {
  console.log('开始测试管理员商家审核页面...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 登录管理员账号
    console.log('正在登录管理员账号...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@ttkh.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待登录成功并跳转到管理员仪表板
    await page.waitForNavigation();
    console.log('管理员登录成功');
    
    // 导航到商家管理页面
    console.log('正在导航到商家管理页面...');
    await page.goto('http://localhost:3000/admin/merchants');
    await page.waitForSelector('h1');
    
    // 检查页面标题
    const title = await page.$eval('h1', el => el.textContent);
    console.log(`页面标题: ${title}`);
    
    // 等待数据加载
    await page.waitForTimeout(2000);
    
    // 检查是否有商家数据
    const merchantsCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length;
    });
    
    console.log(`找到 ${merchantsCount} 个商家`);
    
    if (merchantsCount > 0) {
      console.log('商家数据加载成功');
    } else {
      console.log('警告: 没有找到商家数据');
    }
    
    // 截图
    await page.screenshot({ path: 'admin-merchants-page.png' });
    console.log('已保存页面截图到 admin-merchants-page.png');
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    await browser.close();
  }
}

testAdminMerchantsPage();