# 现在需要做什么？

根据我们之前的配置和准备，您现在需要按照以下步骤操作来完成部署：

## 第一步：推送代码到 GitHub

### 操作方法：
1. 打开文件资源管理器，进入项目目录 `ttkh-tourism-system`
2. 双击运行 [push-to-github.bat](file:///c%3A/Users/46405/txkafa8.7/ttkh-tourism-system/push-to-github.bat) 文件
3. 按照屏幕上的提示操作：
   - 如果您还没有 GitHub 仓库，先在 https://github.com/new 创建一个新仓库
   - 复制新仓库的 HTTPS 地址（例如：`https://github.com/您的用户名/您的仓库名.git`）
   - 在命令行提示符下粘贴仓库地址并按回车
4. 等待推送完成，看到成功消息后关闭窗口

## 第二步：在 Render 上部署后端服务

### 操作方法：
1. 访问 [Render Dashboard](https://dashboard.render.com)
2. 使用 GitHub 账户登录
3. 点击页面右上角的 "New+" 按钮
4. 选择 "Web Service"
5. 连接到您的 GitHub 账户并选择刚刚推送代码的仓库
6. 填写以下配置信息：
   - Name: `ttkh-tourism-backend`
   - Region: `Singapore` (推荐)
   - Branch: `main`
   - Root Directory: **留空**
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
7. 点击页面下方的 "Advanced" 展开高级选项：
   - 添加以下环境变量：
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `JWT_SECRET`: `ttkh-secret-key-2024-render-auto`
     - `DATABASE_URL`: `sqlite:./database.sqlite`
8. 点击 "Create Web Service" 按钮

## 第三步：在 Render 上部署前端服务

### 操作方法：
1. 等待后端服务创建完成（这可能需要几分钟时间）
2. 再次点击 "New+" 按钮
3. 选择 "Static Site"
4. 选择同一个 GitHub 仓库
5. 填写以下配置信息：
   - Name: `ttkh-tourism-frontend`
   - Region: `Singapore` (推荐)
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
6. 点击页面下方的 "Advanced" 展开高级选项：
   - 添加以下环境变量：
     - `REACT_APP_API_URL`: `https://ttkh-tourism-backend.onrender.com`
     （注意：这个 URL 需要在后端服务创建完成后更新为实际的 URL）
7. 点击 "Create Static Site" 按钮

## 第四步：更新前端环境变量

### 操作方法：
1. 等待后端服务部署完成（状态显示为 "Live"）
2. 进入后端服务的设置页面，复制服务的 URL（类似于 `https://ttkh-tourism-backend-xxxx.onrender.com`）
3. 进入前端服务的设置页面：
   - 找到 `REACT_APP_API_URL` 环境变量
   - 将其值更新为您的后端服务实际 URL
   - 保存更改
4. 前端服务将自动重新部署以应用新的环境变量

## 第五步：初始化系统

### 操作方法：
1. 等待前端服务部署完成
2. 访问后端服务的 URL 加上 `/init` 路径来初始化数据库：
   ```
   https://您的后端服务地址.onrender.com/init
   ```
3. 访问后端服务的 URL 加上 `/create-test-users` 路径来创建测试用户：
   ```
   https://您的后端服务地址.onrender.com/create-test-users
   ```

## 第六步：测试系统

### 操作方法：
1. 访问前端服务的 URL（类似于 `https://ttkh-tourism-frontend-xxxx.onrender.com`）
2. 使用以下测试账户登录：
   - 管理员: admin / admin123
   - 商家: merchant1 / merchant123
   - 客户: customer1 / customer123

## 需要帮助？

如果您在任何步骤遇到问题，请参考以下文件：
- [SIMPLE-DEPLOY-GUIDE.md](file:///c%3A/Users/46405/txkafa8.7/ttkh-tourism-system/SIMPLE-DEPLOY-GUIDE.md) - 简单部署指南
- [DEPLOYMENT-CHECKLIST.md](file:///c%3A/Users/46405/txkafa8.7/ttkh-tourism-system/DEPLOYMENT-CHECKLIST.md) - 部署检查清单

如果还有问题，请告诉我具体遇到了什么错误，我会为您提供进一步的帮助。