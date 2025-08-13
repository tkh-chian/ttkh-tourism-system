const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');

async function debugMerchantsPage() {
    console.log('🔧 详细调试商家管理页面...\n');

    // 1. 检查数据库连接和数据
    console.log('📊 1. 检查数据库中的商家数据...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Lhjr@170103',
            database: 'ttkh_tourism'
        });

        const [merchants] = await connection.execute(
            "SELECT id, username, email, role, status FROM users WHERE role = 'merchant'"
        );
        console.log(`✅ 数据库中找到 ${merchants.length} 个商家用户:`);
        merchants.forEach((merchant, index) => {
            console.log(`   ${index + 1}. ${merchant.username} (${merchant.email}) - ${merchant.status}`);
        });

        await connection.end();
    } catch (error) {
        console.log('❌ 数据库连接失败:', error.message);
        return;
    }

    // 2. 测试后端API
    console.log('\n🌐 2. 测试后端API...');
    try {
        const response = await fetch('http://localhost:3001/api/admin/merchants');
        const data = await response.json();
        console.log('✅ API响应状态:', response.status);
        console.log('✅ API响应数据:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.log('❌ API调用失败:', error.message);
        return;
    }

    // 3. 启动浏览器测试
    console.log('\n🌐 3. 启动浏览器测试...');
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();

        // 监听控制台消息
        const consoleMessages = [];
        const networkErrors = [];
        
        page.on('console', msg => {
            const message = `${msg.type()}: ${msg.text()}`;
            consoleMessages.push(message);
            console.log('🖥️  控制台:', message);
        });

        page.on('response', response => {
            if (!response.ok()) {
                const error = `${response.status()} ${response.statusText()} - ${response.url()}`;
                networkErrors.push(error);
                console.log('🌐 网络错误:', error);
            }
        });

        // 访问前端页面
        console.log('\n🔐 4. 登录管理员账号...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        
        // 登录
        await page.type('input[type="email"]', 'admin@ttkh.com');
        await page.type('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // 等待登录完成
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ 管理员登录成功');

        // 导航到商家管理页面
        console.log('\n🏪 5. 导航到商家管理页面...');
        await page.goto('http://localhost:3000/admin/merchants', { waitUntil: 'networkidle2' });
        
        // 等待页面加载
        await page.waitForTimeout(3000);

        // 检查页面内容
        console.log('\n📋 6. 检查页面内容...');
        
        // 检查表格行数
        const tableRows = await page.$$('tbody tr');
        console.log(`✅ 表格行数: ${tableRows.length}`);

        // 检查是否有"暂无数据"文本
        const noDataText = await page.$eval('body', el => el.textContent).catch(() => '');
        if (noDataText.includes('暂无数据') || noDataText.includes('No data')) {
            console.log('⚠️  页面显示"暂无数据"');
        }

        // 检查网络请求
        console.log('\n📡 7. 检查网络请求...');
        const requests = [];
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                requests.push(request.url());
                console.log('📤 API请求:', request.url());
            }
        });

        // 刷新页面以捕获API请求
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        // 检查页面状态
        console.log('\n📊 8. 页面状态检查...');
        
        // 检查是否有加载状态
        const loadingElements = await page.$$('[class*="loading"], [class*="spin"]');
        console.log(`🔄 加载元素数量: ${loadingElements.length}`);

        // 检查表格数据
        const tableData = await page.evaluate(() => {
            const rows = document.querySelectorAll('tbody tr');
            return Array.from(rows).map(row => {
                const cells = row.querySelectorAll('td');
                return Array.from(cells).map(cell => cell.textContent.trim());
            });
        });
        
        console.log('📋 表格数据:', tableData);

        // 检查React组件状态
        const reactState = await page.evaluate(() => {
            // 尝试获取React组件的状态信息
            const merchantsElement = document.querySelector('[data-testid="merchants-table"], table');
            return {
                hasTable: !!merchantsElement,
                tableHTML: merchantsElement ? merchantsElement.outerHTML.substring(0, 500) : null
            };
        });
        
        console.log('⚛️  React状态:', reactState);

        // 保存截图
        await page.screenshot({ path: 'merchants-debug-screenshot.png', fullPage: true });
        console.log('📸 调试截图已保存为 merchants-debug-screenshot.png');

        console.log('\n📊 9. 调试总结:');
        console.log('==================================================');
        console.log(`控制台消息数量: ${consoleMessages.length}`);
        console.log(`网络错误数量: ${networkErrors.length}`);
        console.log(`表格行数: ${tableRows.length}`);
        console.log(`API请求数量: ${requests.length}`);

        if (consoleMessages.length > 0) {
            console.log('\n🖥️  控制台消息:');
            consoleMessages.forEach((msg, index) => {
                console.log(`${index + 1}. ${msg}`);
            });
        }

        if (networkErrors.length > 0) {
            console.log('\n🌐 网络错误:');
            networkErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

    } catch (error) {
        console.log('❌ 浏览器测试失败:', error.message);
    } finally {
        await browser.close();
    }
}

debugMerchantsPage().catch(console.error);