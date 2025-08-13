/**
 * 项目备份脚本
 * 将项目文件备份到指定目录，排除不必要的环境文件
 */

const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const sourceDir = __dirname;
const targetDir = 'C:\\Users\\46405\\Desktop\\8.12可上传产品，可下单，可以处理订单';

// 需要排除的文件和目录
const excludes = [
  'node_modules',
  '.git',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.DS_Store',
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'coverage',
  'tmp',
  'temp'
];

/**
 * 确保目录存在
 * @param {string} dirPath 目录路径
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 复制文件
 * @param {string} src 源文件路径
 * @param {string} dest 目标文件路径
 */
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
  } catch (err) {
    console.error(`复制文件 ${src} 到 ${dest} 失败:`, err);
  }
}

/**
 * 复制文件或目录
 * @param {string} src 源路径
 * @param {string} dest 目标路径
 */
function copyRecursive(src, dest) {
  try {
    // 获取源路径的状态
    const stats = fs.statSync(src);
    
    // 如果是目录
    if (stats.isDirectory()) {
      // 获取目录名
      const dirName = path.basename(src);
      
      // 如果目录名在排除列表中，则跳过
      if (excludes.includes(dirName)) {
        console.log(`跳过排除的目录: ${dirName}`);
        return;
      }
      
      // 创建目标目录
      ensureDir(dest);
      
      // 读取源目录中的所有文件和子目录
      const entries = fs.readdirSync(src);
      
      // 递归复制每个文件和子目录
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        copyRecursive(srcPath, destPath);
      }
    } 
    // 如果是文件
    else if (stats.isFile()) {
      // 获取文件名
      const fileName = path.basename(src);
      
      // 如果文件名在排除列表中，则跳过
      if (excludes.includes(fileName)) {
        console.log(`跳过排除的文件: ${fileName}`);
        return;
      }
      
      // 复制文件
      copyFile(src, dest);
    }
  } catch (err) {
    console.error(`复制 ${src} 到 ${dest} 时出错:`, err);
  }
}

/**
 * 主函数
 */
function main() {
  try {
    console.log(`开始备份项目...`);
    console.log(`源目录: ${sourceDir}`);
    console.log(`目标目录: ${targetDir}`);
    
    // 确保目标目录存在
    ensureDir(targetDir);
    
    // 开始复制
    copyRecursive(sourceDir, targetDir);
    
    console.log(`备份完成!`);
  } catch (err) {
    console.error('备份过程中出错:', err);
  }
}

// 执行主函数
main();