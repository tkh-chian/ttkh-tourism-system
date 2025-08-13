const fs = require('fs').promises;
const path = require('path');

async function fixAppTsxDuplicateImports() {
  console.log('🔧 修复App.tsx重复导入问题...');
  
  try {
    // 读取App.tsx文件
    const appPath = path.join(__dirname, 'frontend', 'src', 'App.tsx');
    let appContent = await fs.readFile(appPath, 'utf8');
    
    console.log('✅ 成功读取App.tsx文件');
    
    // 显示当前导入语句
    const importLines = appContent.split('\n').filter(line => line.includes('import'));
    console.log('\n当前导入语句:');
    importLines.forEach((line, index) => {
      console.log(`  ${index + 1}. ${line}`);
    });
    
    // 移除重复的Orders导入
    const lines = appContent.split('\n');
    const cleanedLines = [];
    let ordersImported = false;
    
    for (const line of lines) {
      if (line.includes("import Orders from './pages/Orders'")) {
        if (!ordersImported) {
          cleanedLines.push(line);
          ordersImported = true;
          console.log('✅ 保留第一个Orders导入语句');
        } else {
          console.log('❌ 移除重复的Orders导入语句');
        }
      } else {
        cleanedLines.push(line);
      }
    }
    
    // 重新组合内容
    const cleanedContent = cleanedLines.join('\n');
    
    // 确保Orders组件在正确的位置导入
    if (!cleanedContent.includes("import Orders from './pages/Orders'")) {
      // 如果没有Orders导入，添加它
      const updatedContent = cleanedContent.replace(
        /import Profile from '\.\/pages\/Profile';/,
        `import Orders from './pages/Orders';\nimport Profile from './pages/Profile';`
      );
      
      await fs.writeFile(appPath, updatedContent);
      console.log('✅ 已添加Orders导入语句');
    } else {
      await fs.writeFile(appPath, cleanedContent);
      console.log('✅ 已移除重复的Orders导入语句');
    }
    
    // 检查路由配置
    console.log('\n检查路由配置...');
    const finalContent = await fs.readFile(appPath, 'utf8');
    
    if (!finalContent.includes('path="/orders"')) {
      console.log('⚠️ 未找到订单路由，正在添加...');
      
      // 查找Routes标签并添加订单路由
      const routePattern = /(<Routes>[\s\S]*?)(<\/Routes>)/;
      const match = finalContent.match(routePattern);
      
      if (match) {
        const routesContent = match[1];
        const routesEnd = match[2];
        
        if (!routesContent.includes('path="/orders"')) {
          const updatedRoutes = routesContent + '\n          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />';
          const updatedContent = finalContent.replace(routePattern, updatedRoutes + '\n        ' + routesEnd);
          
          await fs.writeFile(appPath, updatedContent);
          console.log('✅ 已添加订单路由');
        }
      }
    } else {
      console.log('✅ 订单路由已存在');
    }
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const verifyContent = await fs.readFile(appPath, 'utf8');
    const verifyImportLines = verifyContent.split('\n').filter(line => line.includes('import Orders'));
    
    console.log(`Orders导入语句数量: ${verifyImportLines.length}`);
    if (verifyImportLines.length === 1) {
      console.log('✅ Orders导入语句唯一');
    } else {
      console.log('❌ 仍有重复的Orders导入语句');
    }
    
    // 检查是否有语法错误
    if (verifyContent.includes('import Orders') && verifyContent.includes('path="/orders"')) {
      console.log('✅ App.tsx修复完成');
    } else {
      console.log('❌ App.tsx修复可能不完整');
    }
    
    console.log('\n🚀 请重新启动前端服务以应用修复');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复脚本
fixAppTsxDuplicateImports().catch(console.error);