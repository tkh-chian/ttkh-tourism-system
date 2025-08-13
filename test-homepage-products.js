const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');

async function testHomepageProducts() {
  console.log('🧪 测试首页产品显示...');
  
  // 1. 检查数据库中的产品
  console.log('1. 检查数据库产品...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'tourism_system'
  });
  
  const [products] = await connection.execute('SELECT id, name, status FROM products WHERE status = "approved"');
  console.log(`✅ 数据库中有 ${products.length} 个已审核产品`);
  products.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
  
  await connection.end();
  
  // 2. 测试API
  console.log('\n2. 测试产品API...');
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3001/api/products?status=approved');
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ API返回 ${data.data.length} 个产品`);
    } else {
      console.log('❌ API返回错误:', data.message);
    }
  } catch (error) {
    console.log('❌ API请求失败:', error.message);
  }
  
  // 3. 测试前端页面
  console.log('\n3. 测试前端页面...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 前端错误:', msg.text());
      }
    });
    
    // 访问首页
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // 等待产品加载
    await page.waitForTimeout(3000);
    
    // 检查页面标题
    const title = await page.title();
    console.log('✅ 页面标题:', title);
    
    // 检查是否有产品卡片
    const productCards = await page.$$('.bg-white.rounded-lg.shadow-md');
    console.log(`✅ 找到 ${productCards.length} 个产品卡片`);
    
    // 检查是否显示"没有找到相关产品"
    const noProductsMessage = await page.$('text=没有找到相关产品');
    if (noProductsMessage) {
      console.log('❌ 显示"没有找到相关产品"消息');
    } else {
      console.log('✅ 没有显示"没有找到相关产品"消息');
    }
    
    // 检查加载状态
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⚠️ 页面仍在加载中');
    } else {
      console.log('✅ 页面加载完成');
    }
    
    // 截图保存
    await page.screenshot({ path: 'homepage-test.png', fullPage: true });
    console.log('✅ 截图已保存为 homepage-test.png');
    
    // 等待用户查看
    console.log('\n🔍 请查看浏览器中的首页，按任意键继续...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await browser.close();
  }
}

testHomepageProducts().catch(console.error);