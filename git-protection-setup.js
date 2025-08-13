const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function setupGitProtection() {
  console.log('🔧 设置Git代码保护机制...');
  
  try {
    // 1. 初始化Git仓库（如果还没有）
    try {
      execSync('git status', { cwd: __dirname, stdio: 'ignore' });
      console.log('✅ Git仓库已存在');
    } catch (error) {
      console.log('📦 初始化Git仓库...');
      execSync('git init', { cwd: __dirname });
      console.log('✅ Git仓库初始化完成');
    }
    
    // 2. 创建.gitignore文件
    const gitignoreContent = `
# 依赖文件
node_modules/
*/node_modules/

# 构建输出
build/
dist/
*/build/
*/dist/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 临时文件
.tmp/
temp/

# IDE配置
.vscode/
.idea/
*.swp
*.swo

# 操作系统文件
.DS_Store
Thumbs.db

# 代码保护系统文件
.code-backups/
.file-checksums.json

# 测试覆盖率
coverage/

# 数据库文件
*.sqlite
*.db
`;
    
    await fs.writeFile(path.join(__dirname, '.gitignore'), gitignoreContent.trim());
    console.log('✅ .gitignore文件已创建');
    
    // 3. 创建Git hooks
    const hooksDir = path.join(__dirname, '.git', 'hooks');
    
    try {
      await fs.mkdir(hooksDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在
    }
    
    // 创建pre-commit hook
    const preCommitHook = `#!/bin/sh
# 代码保护系统 - 提交前检查

echo "🔍 检查受保护文件..."

# 运行代码保护系统验证
node code-protection-system.js verify

if [ $? -ne 0 ]; then
    echo "❌ 受保护文件验证失败，提交被阻止"
    echo "请使用 'node code-protection-system.js restore <文件路径>' 恢复文件"
    exit 1
fi

echo "✅ 受保护文件验证通过"
exit 0
`;
    
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    await fs.writeFile(preCommitPath, preCommitHook);
    
    // 设置执行权限（在Windows上可能不需要）
    try {
      execSync(`chmod +x "${preCommitPath}"`);
    } catch (error) {
      // Windows上可能不支持chmod
    }
    
    console.log('✅ Git pre-commit hook已创建');
    
    // 4. 创建受保护分支策略
    const protectedBranchConfig = `
# 受保护分支配置
# 主分支和开发分支需要特殊保护

[branch "main"]
    protected = true
    requireReview = true
    
[branch "master"]
    protected = true
    requireReview = true
    
[branch "production"]
    protected = true
    requireReview = true
`;
    
    await fs.writeFile(path.join(__dirname, '.git-protection-config'), protectedBranchConfig.trim());
    console.log('✅ 受保护分支配置已创建');
    
    // 5. 创建代码审查模板
    const prTemplate = `
## 代码变更说明
请详细描述本次变更的内容和原因。

## 受保护文件检查
- [ ] 已运行代码保护系统验证
- [ ] 确认没有意外修改受保护的核心文件
- [ ] 如有修改受保护文件，已获得相应授权

## 测试确认
- [ ] 已进行人工测试
- [ ] 核心功能正常工作
- [ ] 没有引入新的bug

## 风险评估
- [ ] 低风险变更
- [ ] 中等风险变更
- [ ] 高风险变更（需要额外审查）

## 回滚计划
如果本次变更出现问题，回滚方案：
1. 使用代码保护系统恢复受影响文件
2. 重启相关服务
3. 验证系统功能正常
`;
    
    await fs.writeFile(path.join(__dirname, '.github', 'pull_request_template.md'), prTemplate.trim());
    console.log('✅ PR模板已创建');
    
    // 6. 添加所有文件到Git
    console.log('📦 添加文件到Git...');
    execSync('git add .', { cwd: __dirname });
    
    // 7. 创建初始提交
    try {
      execSync('git commit -m "初始化代码保护系统"', { cwd: __dirname });
      console.log('✅ 初始提交已创建');
    } catch (error) {
      console.log('ℹ️ 没有新的变更需要提交');
    }
    
    console.log('\n🎉 Git代码保护机制设置完成！');
    console.log('\n📋 保护机制包括:');
    console.log('1. ✅ Git仓库初始化');
    console.log('2. ✅ .gitignore配置');
    console.log('3. ✅ Pre-commit hooks（提交前验证）');
    console.log('4. ✅ 受保护分支配置');
    console.log('5. ✅ 代码审查模板');
    
  } catch (error) {
    console.error('❌ Git保护机制设置失败:', error.message);
  }
}

// 运行设置
if (require.main === module) {
  setupGitProtection().catch(console.error);
}

module.exports = setupGitProtection;