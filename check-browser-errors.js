const puppeteer = require('puppeteer');

async function checkBrowserErrors() {
  console.log('🔍 启动浏览器错误检测...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 监听控制台错误
    const consoleErrors = [];
    const networkErrors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ 控制台错误:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('❌ JavaScript错误:', error.message);
    });
    
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
      console.log('❌ 网络错误:', `${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('📱 访问前端页面: http://localhost:3001');
    
    try {
      await page.goto('http://localhost:3001', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // 等待页面加载
      await page.waitForTimeout(5000);
      
      console.log('✅ 页面加载完成');
      
      // 检查页面标题
      const title = await page.title();
      console.log('📄 页面标题:', title);
      
      // 检查是否有React错误边界
      const errorBoundary = await page.$('.error-boundary');
      if (errorBoundary) {
        const errorText = await page.evaluate(el => el.textContent, errorBoundary);
        console.log('❌ React错误边界:', errorText);
      }
      
      // 尝试访问登录页面
      console.log('\n🔐 测试登录页面...');
      await page.goto('http://localhost:3001/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);
      
      // 检查登录表单是否存在
      const emailInput = await page.$('input[name="email"]');
      const passwordInput = await page.$('input[name="password"]');
      const loginButton = await page.$('button[type="submit"]');
      
      if (emailInput && passwordInput && loginButton) {
        console.log('✅ 登录表单元素正常');
        
        // 尝试填写登录信息
        await page.type('input[name="email"]', 'admin@ttkh.com');
        await page.type('input[name="password"]', 'admin123');
        
        console.log('📝 已填写登录信息');
        
        // 点击登录按钮
        await page.click('button[type="submit"]');
        console.log('🔄 已点击登录按钮');
        
        // 等待响应
        await page.waitForTimeout(5000);
        
        // 检查是否跳转
        const currentUrl = page.url();
        console.log('🌐 当前URL:', currentUrl);
        
        if (currentUrl === 'http://localhost:3001/' || currentUrl === 'http://localhost:3001') {
          console.log('✅ 登录成功，已跳转到首页');
        } else {
          console.log('❌ 登录后未跳转到首页');
        }
        
      } else {
        console.log('❌ 登录表单元素缺失');
        console.log('  - 邮箱输入框:', !!emailInput);
        console.log('  - 密码输入框:', !!passwordInput);
        console.log('  - 登录按钮:', !!loginButton);
      }
      
    } catch (error) {
      console.log('❌ 页面访问失败:', error.message);
    }
    
    // 总结错误
    console.log('\n📊 错误总结:');
    console.log('控制台错误数量:', consoleErrors.length);
    console.log('JavaScript错误数量:', jsErrors.length);
    console.log('网络错误数量:', networkErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ 控制台错误详情:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript错误详情:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n❌ 网络错误详情:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.log('❌ 浏览器启动失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 检查puppeteer是否安装
try {
  require('puppeteer');
  checkBrowserErrors().catch(console.error);
} catch (error) {
  console.log('❌ Puppeteer未安装，使用手动检查方式');
  console.log('\n📋 手动检查步骤:');
  console.log('1. 打开Chrome浏览器');
  console.log('2. 按F12打开开发者工具');
  console.log('3. 访问 http://localhost:3001');
  console.log('4. 查看Console标签页的错误信息');
  console.log('5. 查看Network标签页的网络请求失败');
  console.log('6. 将错误信息复制给我');
}