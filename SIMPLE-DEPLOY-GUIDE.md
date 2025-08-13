# 简单部署指南 - TTKH旅游管理系统

## 为新手准备的最简单部署方式

本指南将帮助您以最简单的方式部署TTKH旅游管理系统到Render，而不会破坏任何本地项目文件。

## 第一步：确认本地项目结构

确保您的项目具有以下结构：
```
ttkh-tourism-system/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
├── render.yaml
└── ...
```

## 第二步：推送代码到GitHub

1. 如果您还没有GitHub仓库，请先在GitHub上创建一个新仓库
2. 在本地项目目录中打开命令行工具，运行以下命令：

```bash
git add .
git commit -m "Initial commit - TTKH旅游管理系统"
git push origin main
```

如果您尚未设置远程仓库，需要先运行：
```bash
git remote add origin https://github.com/您的用户名/您的仓库名.git
git branch -M main
git push -u origin main
```

## 第三步：在Render上创建服务

### 创建后端服务

1. 访问 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New+" 按钮
3. 选择 "Web Service"
4. 连接到您的GitHub账户并选择刚刚创建的仓库
5. 填写以下配置：
   - Name: `ttkh-tourism-backend`
   - Region: `Singapore` (或其他您偏好的区域)
   - Branch: `main`
   - Root Directory: 留空
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - 点击 "Advanced" 添加环境变量：
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `JWT_SECRET`: `ttkh-secret-key-2024-render-auto`
     - `DATABASE_URL`: `sqlite:./database.sqlite`

6. 点击 "Create Web Service"

### 创建前端服务

1. 再次点击 "New+" 按钮
2. 选择 "Static Site"
3. 选择同一个GitHub仓库
4. 填写以下配置：
   - Name: `ttkh-tourism-frontend`
   - Region: `Singapore` (或其他您偏好的区域)
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - 点击 "Advanced" 添加环境变量：
     - `REACT_APP_API_URL`: `https://您的后端服务地址.onrender.com` (稍后会更新)

5. 点击 "Create Static Site"

## 第四步：更新前端环境变量

1. 等待后端服务部署完成（通常需要几分钟）
2. 进入后端服务的设置页面，找到服务的URL（类似于 `https://ttkh-tourism-backend-xxxx.onrender.com`）
3. 进入前端服务的设置页面：
   - 修改环境变量 `REACT_APP_API_URL` 为您的后端服务URL
   - 保存更改
4. 前端服务将自动重新部署以应用新的环境变量

## 第五步：初始化系统

1. 部署完成后，访问后端服务的URL加上 `/init` 路径来初始化数据库：
   ```
   https://您的后端服务地址.onrender.com/init
   ```

2. 创建测试用户，访问：
   ```
   https://您的后端服务地址.onrender.com/create-test-users
   ```

## 测试系统

1. 访问前端服务的URL（类似于 `https://ttkh-tourism-frontend-xxxx.onrender.com`）
2. 使用以下测试账户登录：
   - 管理员: admin / admin123
   - 商家: merchant1 / merchant123
   - 客户: customer1 / customer123

## 常见问题

### 1. 如果部署失败
- 检查GitHub仓库中的文件结构是否正确
- 确认 `backend` 和 `frontend` 目录中都有 `package.json` 文件
- 确认 `render.yaml` 文件在项目根目录中

### 2. 如果前后端无法通信
- 确认 `REACT_APP_API_URL` 环境变量设置正确
- 确认后端服务已成功部署并正在运行

### 3. 如果数据库问题
- 本系统使用SQLite数据库，适用于演示目的
- 确保已访问 `/init` 路径初始化数据库

## 注意事项

1. 免费套餐的Web Services在连续15分钟无请求后会进入休眠状态
2. 静态站点服务不会休眠
3. SQLite数据库适用于演示，生产环境建议使用MySQL或PostgreSQL
4. 上传的图片存储在本地文件系统中，生产环境建议使用云存储服务

## 无需修改本地文件

本方案不需要您修改任何本地项目文件，所有配置都在Render平台上完成。