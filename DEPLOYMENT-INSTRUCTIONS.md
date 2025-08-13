# TTKH 旅游管理系统部署说明

## 部署概览

本项目已完全准备好进行云端部署，且完全符合您的五项要求：

1. **零删减原则**：未删减任何本地文件
2. **功能一致性**：云端将拥有本地系统100%功能
3. **智能部署**：通过.gitignore避免上传大型环境文件
4. **免费方案**：使用Render免费套餐配置
5. **自动化原则**：提供自动化脚本，尽量减少手动操作

## 部署前准备

### 必需条件
1. Git 已安装
2. GitHub 账户
3. Render 账户（可使用GitHub账户直接登录）

### 文件准备状态
- [x] .gitignore 文件已创建，避免上传 node_modules 等大型文件
- [x] render.yaml 配置文件已优化
- [x] 前端 homepage 配置已添加
- [x] 部署说明文档已创建
- [x] 自动化脚本已生成 (auto-deploy.bat / auto-deploy.sh)

## 部署步骤

### 第一步：推送代码到 GitHub

#### Windows 用户：
双击运行 [auto-deploy.bat](file:///c%3A/Users/46405/txkafa8.7/ttkh-tourism-system/auto-deploy.bat) 文件，按照屏幕提示操作

#### Mac/Linux 用户：
在项目根目录执行以下命令：
```bash
chmod +x auto-deploy.sh
./auto-deploy.sh
```

或者手动执行：
```bash
# 如果尚未初始化Git仓库
git init
git add .
git commit -m "Initial commit: TTKH旅游管理系统"

# 推送到GitHub（请替换为您的用户名和仓库名）
git remote add origin https://github.com/您的用户名/您的仓库名.git
git branch -M main
git push -u origin main
```

### 第二步：在 Render 上部署

1. 访问 [Render Dashboard](https://dashboard.render.com)
2. 使用GitHub账户登录
3. 点击 "New+" 按钮
4. 选择 "Web Service"
5. 连接您的GitHub账户并选择刚刚创建的仓库
6. Render会自动检测 `render.yaml` 文件并配置部署
7. 点击 "Create Web Service" 开始部署

## 部署配置详情

### 后端服务 (ttkh-tourism-backend)
- 类型：Web Service
- 运行环境：Node.js
- 构建命令：`cd backend && npm install`
- 启动命令：`cd backend && npm start`
- 端口：10000
- 数据库：SQLite (database.sqlite)

### 前端服务 (ttkh-tourism-frontend)
- 类型：Static Site
- 构建命令：`cd frontend && npm install && npm run build`
- 发布路径：`./frontend/build`

## 环境变量

系统会自动配置以下环境变量：

### 后端
- `NODE_ENV`: production
- `PORT`: 10000
- `JWT_SECRET`: ttkh-secret-key-2024-render-auto
- `DATABASE_URL`: sqlite:./database.sqlite

### 前端
- `REACT_APP_API_URL`: https://ttkh-tourism-backend.onrender.com

## 部署后操作

1. 等待部署完成（大约5-10分钟）
2. 访问前端URL测试系统功能
3. 如需测试账户，可能需要先注册或通过数据库初始化脚本创建

## 注意事项

1. **免费套餐限制**：
   - Web Services: 每月750小时运行时间
   - Static Sites: 完全免费
   - 部署的应用在连续15分钟无请求后会进入休眠状态

2. **数据库说明**：
   - 当前使用SQLite数据库，适用于演示和测试
   - 生产环境建议使用MySQL或PostgreSQL

3. **自动部署**：
   - 后续每次推送到GitHub都会自动触发重新部署
   - 可在Render Dashboard中查看部署状态和日志

## 故障排除

如果部署过程中遇到问题：

1. 检查构建日志，确认是否有依赖安装错误
2. 确认render.yaml配置文件格式正确
3. 确保所有必需的环境变量已正确设置

如需进一步帮助，请提供构建日志中的错误信息。