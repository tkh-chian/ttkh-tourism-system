可视化端到端回放测试（Playwright）说明
====================================

简介
----
本方案使用 Playwright 以非无头(headful)模式运行浏览器，记录 trace（包含截图和 DOM 快照）。运行后会生成：
- trace.zip => 使用 Playwright Trace Viewer 回放完整交互（包含网络/控制台/DOM快照）
- 若干 PNG 截图（home.png, after-login.png, merchant-products.png, ...）
- last-page.html （测试最后页面的 HTML 快照）

安装与运行（在项目根目录）
1. 安装 Playwright（仅需一次）：
   npm install -D playwright

2. 安装浏览器二进制（建议安装 chromium）：
   npx playwright install chromium

3. 运行脚本（浏览器会弹出，便于用户观测）：
   node ttkh-tourism-system/playwright/visual-test.js

4. 回放 trace（可视化查看 trace）：
   npx playwright show-trace ttkh-tourism-system/playwright/trace.zip

注意
----
- 脚本尽量使用了通用选择器与容错逻辑，但不同项目的具体表单/路由可能略有不同。如果运行过程中出现找不到元素或登录失败，可根据控制台输出调整选择器（在 playwright/visual-test.js 中修改 fill/click 的选择器）。
- 如果你希望我把 Playwright 集成到 npm script（如 package.json 中添加 "visual:test"），我可以帮你添加。
- 也可改为 Puppeteer headful（更接近现有脚本）——若需要我可以在此基础上生成 Puppeteer 可视化脚本并录制视频。

反馈
----
运行后告诉我是否能看到浏览器交互与 trace，或是否需要我把步骤自动化成 npm script / CI 任务。