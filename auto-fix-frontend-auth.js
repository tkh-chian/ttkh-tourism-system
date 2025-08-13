const puppeteer = require('puppeteer');

async function autoFixFrontendAuth() {
  console.log('🚀 自动修复前端认证并测试...\n');
  
  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // 1. 访问前端首页
    console.log('📱 访问前端首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // 2. 设置管理员认证信息
    console.log('🔑 设置管理员认证信息...');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDYxZGY1NC0zODQ2LTRmN2EtYmUyNC0yNjJmY2JlNGQzMGQiLCJpYXQiOjE3NTQ4OTQ3OTYsImV4cCI6MTc1NDk4MTE5Nn0.Ioi01mcqPIGQpfNvu_p82vU9c4mAJCNlEgmmoSu-4vM');
      localStorage.setItem('user', '{"id":"0461df54-3846-4f7a-be24-262fcbe4d30d","username":"admin@ttkh.com","email":"admin@ttkh.com","role":"admin","company_name":null,"contact_person":null,"phone":null,"status":"approved","created_at":"2025-08-10T17:25:28.000Z","updated_at":"2025-08-11T06:21:20.000Z"}');
    });
    
    // 3. 刷新页面
    console.log('🔄 刷新页面...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    // 4. 测试访问管理员商家管理页面
    console.log('👨‍💼 测试访问管理员商家管理页面...');
    await page.goto('http://localhost:3000/admin/merchants', { waitUntil: 'networkidle2' });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检查页面是否正常加载
    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    if (pageContent.includes('403') || pageContent.includes('Forbidden')) {
      console.log('❌ 仍然存在403错误');
      return false;
    }
    
    if (pageContent.includes('商家管理') || pageContent.includes('Merchants')) {
      console.log('✅ 成功访问商家管理页面！');
      
      // 截图保存
      await page.screenshot({ path: 'ttkh-tourism-system/merchants-page-success.png', fullPage: true });
      console.log('📸 页面截图已保存为 merchants-page-success.png');
      
      return true;
    } else {
      console.log('⚠️ 页面内容异常，需要进一步检查');
      await page.screenshot({ path: 'ttkh-tourism-system/merchants-page-debug.png', fullPage: true });
      return false;
    }
    
  } catch (error) {
    console.error('❌ 自动修复过程中发生错误:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 检查是否安装了puppeteer
async function checkPuppeteer() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('📦 需要安装puppeteer...');
    return false;
  }
}

async function main() {
  const hasPuppeteer = await checkPuppeteer();
  
  if (!hasPuppeteer) {
    console.log('请先安装puppeteer: npm install puppeteer');
    console.log('或者手动在浏览器控制台执行以下命令:');
    console.log(`localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDYxZGY1NC0zODQ2LTRmN2EtYmUyNC0yNjJmY2JlNGQzMGQiLCJpYXQiOjE3NTQ4OTQ3OTYsImV4cCI6MTc1NDk4MTE5Nn0.Ioi01mcqPIGQpfNvu_p82vU9c4mAJCNlEgmmoSu-4vM');`);
    console.log(`localStorage.setItem('user', '{"id":"0461df54-3846-4f7a-be24-262fcbe4d30d","username":"admin@ttkh.com","email":"admin@ttkh.com","role":"admin","company_name":null,"contact_person":null,"phone":null,"status":"approved","created_at":"2025-08-10T17:25:28.000Z","updated_at":"2025-08-11T06:21:20.000Z"}');`);
    console.log('然后访问: http://localhost:3000/admin/merchants');
    return;
  }
  
  const success = await autoFixFrontendAuth();
  
  if (success) {
    console.log('\n🎉 前端认证修复成功！管理员可以正常访问商家管理页面。');
  } else {
    console.log('\n❌ 前端认证修复失败，需要手动检查。');
  }
}

main().catch(console.error);