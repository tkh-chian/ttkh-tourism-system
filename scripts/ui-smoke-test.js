const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:3001/api';

// 测试用户（与已有测试账号保持一致）
const users = {
  admin: { email: 'admin@ttkh.com', password: 'admin123' },
  merchant: { email: 'merchant@ttkh.com', password: 'merchant123' },
  customer: { email: 'customer@test.com', password: '123456' }
};

(async () => {
  const fs = require('fs');
  // 优先使用系统 Chrome，以避免 puppeteer 自带 Chromium 下载/启动问题
  const chromeCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const systemChrome = chromeCandidates.find(p => fs.existsSync(p));
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (systemChrome) {
    launchOptions.executablePath = systemChrome;
  }
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  const results = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    results.pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('requestfailed', req => {
    results.requestFailures.push({ url: req.url(), errorText: req.failure().errorText });
  });

  // helper: login via browser fetch and set localStorage per AuthContext
  async function loginAndSetLocalStorage(role) {
    const credentials = users[role];
    const loginResult = await page.evaluate(async (apiBase, creds) => {
      try {
        const res = await fetch(apiBase + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds)
        });
        const data = await res.json();
        return data;
      } catch (e) {
        return { error: e.message };
      }
    }, API_BASE, credentials);

    if (loginResult && loginResult.success && loginResult.data) {
      const user = loginResult.data.user;
      const token = loginResult.data.token;
      await page.evaluate((u, t) => {
        try {
          localStorage.setItem('user', JSON.stringify(u));
          localStorage.setItem('token', t);
        } catch (e) {}
      }, user, token);
      return true;
    } else {
      results.consoleErrors.push({ text: `登录失败:${role} - ${JSON.stringify(loginResult)}` });
      return false;
    }
  }

  // Test homepage
  async function testHome() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    // wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    // ensure product cards exist or show no error
    const productCount = await page.evaluate(() => {
      try {
        const cards = document.querySelectorAll('[data-testid="product-card"], .product-card, .productItem');
        return cards ? cards.length : 0;
      } catch (e) { return 0; }
    });
    return { ok: true, productCount };
  }

  // Test product detail: try to click first product from homepage and open detail
  async function testProductDetail() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const clicked = await page.evaluate(() => {
      const selector = '[data-testid="product-card"] a, .product-card a, .productItem a';
      const el = document.querySelector(selector);
      if (el) {
        el.click();
        return true;
      }
      return false;
    });
    if (!clicked) {
      // try direct route if available
      return { ok: true, info: 'no product link found - skipping detail' };
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ok: true };
  }

  // Test admin orders page
  async function testAdminOrders() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const logged = await loginAndSetLocalStorage('admin');
    if (!logged) return { ok: false, reason: 'admin login failed' };
    await page.reload({ waitUntil: 'networkidle2' });
    await page.goto(BASE_URL + '/admin/orders', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ok: true };
  }

  // Test merchant product management
  async function testMerchantProducts() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const logged = await loginAndSetLocalStorage('merchant');
    if (!logged) return { ok: false, reason: 'merchant login failed' };
    await page.reload({ waitUntil: 'networkidle2' });
    await page.goto(BASE_URL + '/merchant/products', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ok: true };
  }

  // Test user orders page
  async function testUserOrders() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const logged = await loginAndSetLocalStorage('customer');
    if (!logged) return { ok: false, reason: 'customer login failed' };
    await page.reload({ waitUntil: 'networkidle2' });
    await page.goto(BASE_URL + '/orders', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ok: true };
  }

  // Run tests sequentially
  const summary = {};
  summary.home = await testHome();
  summary.productDetail = await testProductDetail();
  summary.adminOrders = await testAdminOrders();
  summary.merchantProducts = await testMerchantProducts();
  summary.userOrders = await testUserOrders();

  // Collect results
  console.log('--- UI SMOKE TEST SUMMARY ---');
  console.log('Page results:', JSON.stringify(summary, null, 2));
  console.log('Console errors:', JSON.stringify(results.consoleErrors, null, 2));
  console.log('Page errors:', JSON.stringify(results.pageErrors, null, 2));
  console.log('Request failures:', JSON.stringify(results.requestFailures, null, 2));

  const hasBlocking =
    results.consoleErrors.length > 0 ||
    results.pageErrors.length > 0 ||
    results.requestFailures.length > 0 ||
    summary.adminOrders.ok === false ||
    summary.merchantProducts.ok === false ||
    summary.userOrders.ok === false;

  await browser.close();

  if (hasBlocking) {
    console.error('UI Smoke Test FAILED - see above details');
    process.exit(1);
  } else {
    console.log('UI Smoke Test PASSED');
    process.exit(0);
  }
})();