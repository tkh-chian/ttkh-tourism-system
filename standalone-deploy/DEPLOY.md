# 自动部署说明

## 方法1：Railway.app (推荐)
1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择这个仓库
5. 自动部署完成

## 方法2：Render.com
1. 访问 https://render.com
2. 点击 "New" -> "Web Service"
3. 连接 GitHub 仓库
4. 配置：
   - Build Command: npm install
   - Start Command: npm start
   - Environment: Node

## 方法3：Vercel
1. 访问 https://vercel.com
2. 点击 "New Project"
3. Import from GitHub
4. 自动部署

## 测试账号
- admin / admin123
- merchant1 / merchant123
- customer1 / customer123

部署后访问 /health 检查状态
