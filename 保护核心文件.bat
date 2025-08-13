@echo off
chcp 65001 >nul
echo 🛡️ 启动代码保护系统...
echo.

echo 📦 初始化Git保护机制...
node git-protection-setup.js
echo.

echo 🛡️ 保护核心功能文件...
node code-protection-system.js protect-core
echo.

echo 🔍 验证文件完整性...
node code-protection-system.js verify
echo.

echo 📄 生成保护报告...
node code-protection-system.js report
echo.

echo ✅ 代码保护系统设置完成！
echo.
echo 📋 可用命令:
echo   node code-protection-system.js verify     - 验证文件完整性
echo   node code-protection-system.js restore 文件路径 - 恢复被修改的文件
echo   node code-protection-system.js protect 文件路径 - 保护新文件
echo   node code-protection-system.js report     - 生成保护报告
echo.
pause