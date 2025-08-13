const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');

async function testMerchantsPageFix() {
    console.log('🔧 测试商家管理页面修复...');
    
    let browser;
    let connection;
    
    try {
        // 1. 连接数据库验证商家数据
        console.log('\n📊 1. 验证数据库中的商家数据...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Lhjr@170103',
            database: 'ttkh_tourism'
        });
        
        const [merchants] = await connection.execute(
            'SELECT id, username, email, role, status, created_at FROM users WHERE role = "merchant" ORDER BY created_at DESC LIMIT 5'
        );
        
        console.log(`✅ 数据库中找到 ${merchants.length} 个商家用户:`);
        merchants.forEach((merchant, index) => {
            console.log(`   ${index + 1}. ${merchant.username} (${merchant.email}) - ${merchant.status}`);
        });
        
        // 2. 启动浏览器测试
        console.log('\n🌐 2. 启动浏览器测试...');
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // 监听网络请求
        const requests = [];
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                requests.push({
                    url: request.url(),
                    method: request.method()
                });
            }
        });
        
        // 监听响应
        const responses = [];
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                responses.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });
        
        // 3. 登录管理员账号
        console.log('\n🔐 3. 登录管理员账号...');
        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[type="email"]');
        
        await page.type('input[type="email"]', 'admin@ttkh.com');
        await page.type('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // 等待登录成功
        await page.waitForNavigation();
        console.log('✅ 管理员登录成功');
        
        // 4. 导航到商家管理页面
        console.log('\n🏪 4. 导航到商家管理页面...');
        await page.goto('http://localhost:3000/admin/merchants');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 等待页面加载
        
        // 5. 检查API调用
        console.log('\n📡 5. 检查API调用...');
        const merchantsApiCall = requests.find(req => req.url.includes('/api/admin/merchants'));
        const wrongApiCall = requests.find(req => req.url.includes('/api/admin/users?status=pending'));
        
        if (merchantsApiCall) {
            console.log('✅ 正确的API调用已发出:', merchantsApiCall.url);
        } else {
            console.log('❌ 未找到正确的API调用');
        }
        
        if (wrongApiCall) {
            console.log('❌ 仍然存在错误的API调用:', wrongApiCall.url);
        } else {
            console.log('✅ 没有错误的API调用');
        }
        
        // 6. 检查页面内容
        console.log('\n📋 6. 检查页面显示的商家数据...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 查找表格行
        const tableRows = await page.$$('tbody tr');
        console.log(`✅ 页面显示 ${tableRows.length} 行商家数据`);
        
        // 检查是否显示了最新的商家
        const pageContent = await page.content();
        const latestMerchants = merchants.slice(0, 3); // 检查最新的3个商家
        
        let foundMerchants = 0;
        for (const merchant of latestMerchants) {
            if (pageContent.includes(merchant.username) || pageContent.includes(merchant.email)) {
                console.log(`✅ 找到商家: ${merchant.username}`);
                foundMerchants++;
            } else {
                console.log(`❌ 未找到商家: ${merchant.username}`);
            }
        }
        
        // 7. 截图保存
        console.log('\n📸 7. 保存页面截图...');
        await page.screenshot({ 
            path: 'merchants-page-test.png', 
            fullPage: true 
        });
        console.log('✅ 截图已保存为 merchants-page-test.png');
        
        // 8. 测试结果总结
        console.log('\n📊 8. 测试结果总结:');
        console.log('='.repeat(50));
        console.log(`数据库商家数量: ${merchants.length}`);
        console.log(`页面显示行数: ${tableRows.length}`);
        console.log(`找到的商家数量: ${foundMerchants}/${latestMerchants.length}`);
        console.log(`API调用正确: ${merchantsApiCall ? '是' : '否'}`);
        console.log(`无错误API调用: ${!wrongApiCall ? '是' : '否'}`);
        
        const success = merchantsApiCall && !wrongApiCall && foundMerchants > 0;
        console.log(`\n${success ? '✅ 测试通过' : '❌ 测试失败'}: 商家管理页面${success ? '已修复' : '仍有问题'}`);
        
        if (success) {
            console.log('\n🎉 修复成功! 商家管理页面现在可以正确显示商家用户了。');
        } else {
            console.log('\n⚠️  仍需进一步调试。请检查控制台错误信息。');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
        if (browser) {
            await browser.close();
        }
    }
}

// 运行测试
testMerchantsPageFix().catch(console.error);