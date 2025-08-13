const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // 输出目录
  const outDir = path.join(__dirname);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,            // 有界面，便于观察
    slowMo: 100,                // 放慢操作以便观看
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });

  // 开启 trace（包含截图与 DOM 快照）
  await context.tracing.start({ screenshots: true, snapshots: true });

  const page = await context.newPage();

  try {
    console.log('打开首页 http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'home.png') });

    // 尝试登录为商家（如果页面存在登录表单）
    console.log('尝试打开登录页并登录（merchant@ttkh.com / merchant123）');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(800);

    // 常见 input 名称，尽量兼容多实现（若没有，会被忽略）
    try { await page.fill('input[name="email"]', 'merchant@ttkh.com'); } catch(e) {}
    try { await page.fill('input[name="username"]', 'merchant'); } catch(e) {}
    try { await page.fill('input[type="email"]', 'merchant@ttkh.com'); } catch(e) {}
    try { await page.fill('input[name="password"]', 'merchant123'); } catch(e) {}
    try { await page.fill('input[type="password"]', 'merchant123'); } catch(e) {}

    // 提交按钮尝试（多种选择）
    await Promise.all([
      page.click('button[type="submit"]').catch(()=>{}),
      page.click('button:has-text("登录")').catch(()=>{}),
      page.click('button:has-text("Sign in")').catch(()=>{})
    ]);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'after-login.png') });

    // 访问商家产品页并截图
    console.log('打开商家产品页 /merchant/products');
    await page.goto('http://localhost:3000/merchant/products', { waitUntil: 'domcontentloaded' }).catch(()=>{});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, 'merchant-products.png') });

    // 访问产品详情（若有链接）
    try {
      const firstProductLink = await page.$('a[href*="/product"], a[href*="/products"], a:has-text("详情"), a:has-text("Detail")');
      if (firstProductLink) {
        await firstProductLink.click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(outDir, 'product-detail.png') });
      } else {
        console.log('未找到产品详情链接，跳过详情页。');
      }
    } catch (e) {
      console.log('跳转详情页异常：', e.message);
    }

    // 访问商家订单页并截图
    console.log('打开商家订单页 /merchant/orders');
    await page.goto('http://localhost:3000/merchant/orders', { waitUntil: 'domcontentloaded' }).catch(()=>{});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'merchant-orders.png') });

    // 结束 tracing 并保存 trace.zip
    const tracePath = path.join(outDir, 'trace.zip');
    await context.tracing.stop({ path: tracePath });
    console.log('Trace 已生成:', tracePath);

    // 额外保存一个页面快照 HTML 供离线查看（可选）
    try {
      const html = await page.content();
      fs.writeFileSync(path.join(outDir, 'last-page.html'), html, 'utf8');
    } catch (e) {}

    console.log('可视化测试完成，截图已保存到 playwright 目录。');
  } catch (err) {
    console.error('执行可视化测试出错:', err);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();