const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CodeProtectionSystem {
  constructor() {
    this.protectedFiles = new Map();
    this.backupDir = path.join(__dirname, '.code-backups');
    this.protectionConfigFile = path.join(__dirname, '.code-protection.json');
    this.checksumFile = path.join(__dirname, '.file-checksums.json');
  }

  // 计算文件的MD5校验和
  async calculateChecksum(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  // 初始化保护系统
  async initialize() {
    console.log('🛡️ 初始化代码保护系统...');
    
    try {
      // 创建备份目录
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // 加载现有的保护配置
      await this.loadProtectionConfig();
      
      console.log('✅ 代码保护系统初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
    }
  }

  // 加载保护配置
  async loadProtectionConfig() {
    try {
      const configData = await fs.readFile(this.protectionConfigFile, 'utf8');
      const config = JSON.parse(configData);
      
      for (const [filePath, info] of Object.entries(config.protectedFiles || {})) {
        this.protectedFiles.set(filePath, info);
      }
      
      console.log(`📋 已加载 ${this.protectedFiles.size} 个受保护文件的配置`);
    } catch (error) {
      console.log('📋 未找到现有保护配置，将创建新的配置');
    }
  }

  // 保存保护配置
  async saveProtectionConfig() {
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      protectedFiles: Object.fromEntries(this.protectedFiles)
    };
    
    await fs.writeFile(this.protectionConfigFile, JSON.stringify(config, null, 2));
  }

  // 标记文件为受保护状态
  async protectFile(filePath, reason = '人工测试通过') {
    console.log(`🛡️ 保护文件: ${filePath}`);
    
    try {
      const absolutePath = path.resolve(filePath);
      const checksum = await this.calculateChecksum(absolutePath);
      
      if (!checksum) {
        console.error(`❌ 无法读取文件: ${filePath}`);
        return false;
      }
      
      // 创建备份
      const backupPath = await this.createBackup(absolutePath, checksum);
      
      // 记录保护信息
      this.protectedFiles.set(filePath, {
        checksum,
        backupPath,
        protectedAt: new Date().toISOString(),
        reason,
        status: 'protected'
      });
      
      await this.saveProtectionConfig();
      console.log(`✅ 文件已受保护: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ 保护文件失败: ${error.message}`);
      return false;
    }
  }

  // 创建文件备份
  async createBackup(filePath, checksum) {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileName}.${checksum.substring(0, 8)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);
    
    await fs.copyFile(filePath, backupPath);
    console.log(`📦 已创建备份: ${backupFileName}`);
    
    return backupPath;
  }

  // 检查文件是否被修改
  async checkFileIntegrity(filePath) {
    const protectionInfo = this.protectedFiles.get(filePath);
    if (!protectionInfo) {
      return { isProtected: false };
    }
    
    const currentChecksum = await this.calculateChecksum(path.resolve(filePath));
    const isModified = currentChecksum !== protectionInfo.checksum;
    
    return {
      isProtected: true,
      isModified,
      originalChecksum: protectionInfo.checksum,
      currentChecksum,
      protectionInfo
    };
  }

  // 验证所有受保护文件的完整性
  async verifyAllProtectedFiles() {
    console.log('🔍 验证所有受保护文件的完整性...');
    
    const results = {
      total: this.protectedFiles.size,
      intact: 0,
      modified: 0,
      missing: 0,
      details: []
    };
    
    for (const [filePath, protectionInfo] of this.protectedFiles) {
      const integrity = await this.checkFileIntegrity(filePath);
      
      let status = 'unknown';
      if (!integrity.currentChecksum) {
        status = 'missing';
        results.missing++;
      } else if (integrity.isModified) {
        status = 'modified';
        results.modified++;
      } else {
        status = 'intact';
        results.intact++;
      }
      
      results.details.push({
        filePath,
        status,
        protectedAt: protectionInfo.protectedAt,
        reason: protectionInfo.reason
      });
      
      console.log(`${this.getStatusIcon(status)} ${filePath} - ${status}`);
    }
    
    console.log(`\n📊 验证结果: ${results.intact} 完整, ${results.modified} 已修改, ${results.missing} 缺失`);
    return results;
  }

  // 获取状态图标
  getStatusIcon(status) {
    const icons = {
      intact: '✅',
      modified: '⚠️',
      missing: '❌',
      unknown: '❓'
    };
    return icons[status] || '❓';
  }

  // 恢复文件到受保护状态
  async restoreFile(filePath) {
    const protectionInfo = this.protectedFiles.get(filePath);
    if (!protectionInfo) {
      console.error(`❌ 文件未受保护: ${filePath}`);
      return false;
    }
    
    try {
      console.log(`🔄 恢复文件: ${filePath}`);
      await fs.copyFile(protectionInfo.backupPath, path.resolve(filePath));
      console.log(`✅ 文件已恢复: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ 恢复文件失败: ${error.message}`);
      return false;
    }
  }

  // 批量保护核心文件
  async protectCoreFiles() {
    console.log('🛡️ 保护核心功能文件...');
    
    const coreFiles = [
      // 前端核心组件
      'frontend/src/components/OrderForm.tsx',
      'frontend/src/pages/ProductDetail.tsx',
      'frontend/src/services/api.ts',
      'frontend/src/contexts/AuthContext.tsx',
      'frontend/src/pages/auth/Login.tsx',
      'frontend/src/pages/auth/Register.tsx',
      'frontend/src/App.tsx',
      
      // 后端核心文件
      'backend/simple-server-fixed.js',
      'backend/controllers/authController.js',
      'backend/controllers/orderController.js',
      'backend/controllers/productController.js',
      'backend/routes/auth.js',
      'backend/routes/orders.js',
      'backend/routes/products.js',
      
      // 数据库模型
      'backend/models/User.js',
      'backend/models/Product.js',
      'backend/models/Order.js',
      'backend/models/PriceSchedule.js'
    ];
    
    let protectedCount = 0;
    for (const filePath of coreFiles) {
      const fullPath = path.join(__dirname, filePath);
      try {
        await fs.access(fullPath);
        if (await this.protectFile(filePath, '核心功能文件 - 人工测试通过')) {
          protectedCount++;
        }
      } catch (error) {
        console.log(`⚠️ 文件不存在，跳过: ${filePath}`);
      }
    }
    
    console.log(`✅ 已保护 ${protectedCount} 个核心文件`);
  }

  // 生成保护报告
  async generateProtectionReport() {
    const verification = await this.verifyAllProtectedFiles();
    const reportPath = path.join(__dirname, '代码保护报告.md');
    
    const report = `# 代码保护系统报告

## 生成时间
${new Date().toLocaleString('zh-CN')}

## 保护统计
- 总受保护文件数: ${verification.total}
- 完整文件数: ${verification.intact}
- 已修改文件数: ${verification.modified}
- 缺失文件数: ${verification.missing}

## 文件详情

${verification.details.map(detail => `
### ${detail.filePath}
- **状态**: ${detail.status}
- **保护时间**: ${new Date(detail.protectedAt).toLocaleString('zh-CN')}
- **保护原因**: ${detail.reason}
`).join('\n')}

## 使用说明

### 保护新文件
\`\`\`bash
node code-protection-system.js protect <文件路径> [原因]
\`\`\`

### 验证文件完整性
\`\`\`bash
node code-protection-system.js verify
\`\`\`

### 恢复被修改的文件
\`\`\`bash
node code-protection-system.js restore <文件路径>
\`\`\`

### 生成保护报告
\`\`\`bash
node code-protection-system.js report
\`\`\`
`;
    
    await fs.writeFile(reportPath, report);
    console.log(`📄 保护报告已生成: ${reportPath}`);
  }

  // 命令行接口
  async handleCommand(command, args) {
    await this.initialize();
    
    switch (command) {
      case 'protect':
        if (args.length < 1) {
          console.error('用法: protect <文件路径> [原因]');
          return;
        }
        await this.protectFile(args[0], args[1] || '手动保护');
        break;
        
      case 'verify':
        await this.verifyAllProtectedFiles();
        break;
        
      case 'restore':
        if (args.length < 1) {
          console.error('用法: restore <文件路径>');
          return;
        }
        await this.restoreFile(args[0]);
        break;
        
      case 'report':
        await this.generateProtectionReport();
        break;
        
      case 'protect-core':
        await this.protectCoreFiles();
        break;
        
      default:
        console.log(`
🛡️ 代码保护系统

可用命令:
  protect <文件路径> [原因]  - 保护指定文件
  verify                    - 验证所有受保护文件
  restore <文件路径>        - 恢复被修改的文件
  report                    - 生成保护报告
  protect-core              - 保护所有核心文件
        `);
    }
  }
}

// 命令行执行
if (require.main === module) {
  const protection = new CodeProtectionSystem();
  const [,, command, ...args] = process.argv;
  
  protection.handleCommand(command || 'help', args).catch(console.error);
}

module.exports = CodeProtectionSystem;