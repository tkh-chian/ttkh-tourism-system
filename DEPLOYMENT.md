# TTKH 旅游管理系统 - 云端部署指南

## 项目概述

TTKH旅游管理系统是一个完整的旅游产品管理平台，支持多角色用户（管理员、商家、客户、代理）进行产品发布、审核、预订和管理。

## 技术栈

### 后端
- Node.js + Express
- Sequelize ORM
- SQLite/MySQL 数据库
- JWT 认证

### 前端
- React 18
- TypeScript
- Tailwind CSS
- React Router

## 部署架构

此项目使用 Render 进行部署，包含两个服务：

1. **后端服务** (ttkh-tourism-backend)
   - Node.js Web Service
   - 使用 SQLite 数据库（演示用途）
   - 运行在端口 10000

2. **前端服务** (ttkh-tourism-frontend)
   - 静态网站托管
   - 通过 React 构建生成

## 本地开发

### 后端启动
```bash
cd backend
npm install
npm start
```

默认运行在 http://localhost:3001

### 前端启动
```bash
cd frontend
npm install
npm start
```

默认运行在 http://localhost:3000

## 部署说明

此项目已配置为可在 Render 平台上一键部署：

1. Fork 此仓库到您的 GitHub 账户
2. 登录 Render.com
3. 创建新 Web Service，连接到您的 GitHub 仓库
4. Render 会自动使用项目中的 render.yaml 配置文件进行部署

## 环境变量

### 后端环境变量
- `NODE_ENV`: 运行环境（production/development）
- `PORT`: 服务端口（默认10000）
- `JWT_SECRET`: JWT 加密密钥
- `DATABASE_URL`: 数据库连接 URL

### 前端环境变量
- `REACT_APP_API_URL`: 后端 API 地址

## 数据库

当前配置使用 SQLite 数据库用于演示目的。如需在生产环境中使用 MySQL，请修改 DATABASE_URL 环境变量。

## 用户角色和默认账户

系统包含以下用户角色：
- 管理员 (Admin)
- 商家 (Merchant)
- 客户 (Customer)
- 代理 (Agent)

部署后需要创建测试用户账户以进行功能测试。

## 注意事项

1. 此部署使用免费的 Render 方案
2. SQLite 数据库仅用于演示，生产环境建议使用 MySQL 或 PostgreSQL
3. 静态资源存储在本地文件系统中，生产环境建议使用云存储服务