# TTKH旅游管理系统部署检查清单

## 部署前检查

在开始部署之前，请确保完成以下检查项：

### 1. 本地环境检查
- [ ] Git已安装（在命令行中运行 `git --version` 确认）
- [ ] Node.js已安装（在命令行中运行 `node --version` 确认）
- [ ] npm已安装（在命令行中运行 `npm --version` 确认）

### 2. 项目文件检查
- [ ] 项目根目录包含 `backend` 文件夹
- [ ] 项目根目录包含 `frontend` 文件夹
- [ ] `backend` 文件夹中包含 `package.json` 文件
- [ ] `frontend` 文件夹中包含 `package.json` 文件
- [ ] 项目根目录包含 `render.yaml` 文件
- [ ] 项目根目录包含 `SIMPLE-DEPLOY-GUIDE.md` 文件

### 3. GitHub准备
- [ ] 已在GitHub上创建账户
- [ ] 已创建用于部署的仓库（推荐名称：ttkh-tourism-system）
- [ ] 仓库为空或者可以被覆盖

### 4. Render准备
- [ ] 已在Render上创建账户（可以使用GitHub账户直接登录）
- [ ] 已连接Render到GitHub账户

## 部署步骤

### 第一步：推送代码到GitHub
- [ ] 双击运行 `push-to-github.bat` 文件
- [ ] 按照提示输入GitHub仓库地址
- [ ] 确认代码已成功推送到GitHub

### 第二步：在Render上部署后端服务
- [ ] 访问 [Render Dashboard](https://dashboard.render.com)
- [ ] 点击 "New+" 按钮，选择 "Web Service"
- [ ] 选择您刚刚推送的GitHub仓库
- [ ] 填写配置信息：
  - Name: `ttkh-tourism-backend`
  - Region: `Singapore`
  - Branch: `main`
  - Root Directory: （留空）
  - Environment: `Node`
  - Build Command: `cd backend && npm install`
  - Start Command: `cd backend && npm start`
- [ ] 添加环境变量：
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `JWT_SECRET`: `ttkh-secret-key-2024-render-auto`
  - `DATABASE_URL`: `sqlite:./database.sqlite`
- [ ] 点击 "Create Web Service"

### 第三步：在Render上部署前端服务
- [ ] 再次点击 "New+" 按钮，选择 "Static Site"
- [ ] 选择同一个GitHub仓库
- [ ] 填写配置信息：
  - Name: `ttkh-tourism-frontend`
  - Region: `Singapore`
  - Branch: `main`
  - Root Directory: `frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `build`
- [ ] 添加环境变量：
  - `REACT_APP_API_URL`: `https://ttkh-tourism-backend.onrender.com`（稍后更新）
- [ ] 点击 "Create Static Site"

### 第四步：更新前端环境变量
- [ ] 等待后端服务部署完成
- [ ] 复制后端服务的URL（类似于 `https://ttkh-tourism-backend-xxxx.onrender.com`）
- [ ] 进入前端服务设置页面
- [ ] 更新 `REACT_APP_API_URL` 环境变量为后端服务URL
- [ ] 保存更改，前端将自动重新部署

### 第五步：初始化系统
- [ ] 访问后端URL + `/init` 路径初始化数据库
- [ ] 访问后端URL + `/create-test-users` 创建测试用户

### 第六步：测试系统
- [ ] 访问前端URL
- [ ] 使用测试账户登录：
  - 管理员: admin / admin123
  - 商家: merchant1 / merchant123
  - 客户: customer1 / customer123

## 常见问题排查

### 如果部署失败
1. 检查GitHub仓库中的文件结构是否正确
2. 确认 `backend` 和 `frontend` 目录中都有 `package.json` 文件
3. 确认 `render.yaml` 文件在项目根目录中

### 如果前后端无法通信
1. 确认 `REACT_APP_API_URL` 环境变量设置正确
2. 确认后端服务已成功部署并正在运行

### 如果数据库问题
1. 确保已访问 `/init` 路径初始化数据库
2. 本系统使用SQLite数据库，适用于演示目的

## 完成确认

部署完成后，请检查以下项目：

- [ ] 后端服务正常运行（状态显示为 "Live"）
- [ ] 前端服务正常运行（状态显示为 "Live"）
- [ ] 可以访问前端网站
- [ ] 可以使用测试账户登录系统
- [ ] 可以正常浏览产品列表
- [ ] 可以正常创建订单

## 注意事项

1. 免费套餐的Web Services在连续15分钟无请求后会进入休眠状态
2. 静态站点服务不会休眠
3. SQLite数据库适用于演示，生产环境建议使用MySQL或PostgreSQL
4. 上传的图片存储在本地文件系统中，生产环境建议使用云存储服务