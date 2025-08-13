@echo oftitle TTKH旅游系统人工测试启动器
echo ================================
echo TTKH旅游系统人工测试启动器
echo ================================
echo.

echo 正在启动系统服务...
node "c:\Users\46405\txkafa8.7\ttkh-tourism-system\fixed-complete-auto-test.js"

echo.
echo 系统启动完成！
echo.
echo 请在浏览器中访问以下地址进行人工测试：
echo 前端界面: http://localhost:3000
echo 后端接口: http://localhost:3001
echo.
echo 管理员测试账户:
echo 邮箱: admin@ttkh.com
echo 密码: admin123
echo.
echo 请按任意键打开浏览器并开始人工测试...
pause >nul

echo 正在打开浏览器...
start http://localhost:3000

echo.
echo 测试已启动，请在浏览器中进行人工测试！
echo.
echo 请参考 "人工测试指南.md" 文件获取详细的测试步骤。
echo.
pause