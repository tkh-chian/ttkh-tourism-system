# Render 部署详细指南

## 前提条件
您已完成以下步骤：
- 在 GitHub 上创建了一个新仓库
- 将代码推送到 GitHub
- 在 Render.com 上连接了您的 GitHub 账户

## 在 Render 上部署应用

### 第一步：创建后端服务

1. 访问 [Render Dashboard](https://dashboard.render.com)

2. 点击 "New+" 按钮，然后选择 "Web Service"

3. 选择您刚刚推送代码的 GitHub 仓库

4. 填写以下配置信息：
   - Name: `ttkh-tourism-backend` (或您喜欢的名称)
   - Region: `Singapore` (或其他您偏好的区域)
   - Branch: `main` (或您的默认分支)
   - Root Directory: `/backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. 点击 "Advanced" 展开高级选项：
   - 添加以下环境变量：
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `JWT_SECRET`: `ttkh-secret-key-2024-render-auto`
     - `DATABASE_URL`: `sqlite:./database.sqlite`

6. 点击 "Create Web Service" 创建服务

### 第二步：创建前端服务

1. 再次点击 "New+" 按钮，然后选择 "Static Site"

2. 选择同一个 GitHub 仓库

3. 填写以下配置信息：
   - Name: `ttkh-tourism-frontend` (或您喜欢的名称)
   - Region: `Singapore` (或其他您偏好的区域)
   - Branch: `main` (或您的默认分支)
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

4. 点击 "Advanced" 展开高级选项：
   - 添加以下环境变量：
     - `REACT_APP_API_URL`: `https://你的后端服务地址.onrender.com` (稍后会更新)

5. 点击 "Create Static Site" 创建静态站点

### 第三步：更新前端环境变量

1. 等待后端服务部署完成（通常需要几分钟）

2. 进入后端服务的设置页面，找到服务的 URL（类似于 `https://ttkh-tourism-backend.onrender.com`）

3. 进入前端服务的设置页面：
   - 修改环境变量 `REACT_APP_API_URL` 为您的后端服务 URL
   - 保存更改

4. 前端服务将自动重新部署以应用新的环境变量

## 部署后操作

### 初始化数据库和创建测试用户

1. 部署完成后，访问后端服务的 URL 加上 `/init` 路径来初始化数据库：
   ```
   https://你的后端服务地址.onrender.com/init
   ```

2. 创建测试用户，访问：
   ```
   https://你的后端服务地址.onrender.com/create-test-users
   ```

### 测试系统

1. 访问前端服务的 URL（类似于 `https://ttkh-tourism-frontend.onrender.com`）

2. 使用以下测试账户登录：
   - 管理员: admin / admin123
   - 商家: merchant1 / merchant123
   - 客户: customer1 / customer123

## 常见问题和解决方案

### 1. 服务启动失败
- 检查日志中的错误信息
- 确认环境变量是否正确设置
- 确认 Build Command 和 Start Command 是否正确

### 2. 前后端无法通信
- 确认 `REACT_APP_API_URL` 环境变量是否设置为正确的后端 URL
- 确认后端服务是否正常运行

### 3. 数据库连接问题
- 确认 `DATABASE_URL` 环境变量是否正确设置
- 本系统使用 SQLite 数据库，适用于演示目的

## 监控和维护

- 在 Render Dashboard 中可以查看服务状态和日志
- 每次推送到 GitHub 仓库都会自动触发重新部署
- 免费套餐每月有 750 小时的运行时间限制

## 注意事项

1. 免费套餐的 Web Services 在连续 15 分钟无请求后会进入休眠状态
2. 静态站点服务不会休眠
3. SQLite 数据库适用于演示，生产环境建议使用 MySQL 或 PostgreSQL
4. 上传的图片存储在本地文件系统中，生产环境建议使用云存储服务