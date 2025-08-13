# 🔧 Render.com 目录结构问题解决方案

## 📋 问题分析
错误信息: "Root directory 'backend' does not exist"

这说明GitHub仓库中的目录结构与Render.com的期望不匹配。

## 🛠️ 解决方案

### 方案1：修改Root Directory设置（推荐）
1. 回到Render.com的服务设置页面
2. 找到 **Root Directory** 设置
3. 将 `backend` 改为 **留空** 或 **`ttkh-tourism-system/backend`**
4. 重新部署

### 方案2：修改Build和Start命令
如果Root Directory留空，修改命令为：
- **Build Command**: `cd ttkh-tourism-system/backend && npm install`
- **Start Command**: `cd ttkh-tourism-system/backend && npm start`

### 方案3：重新创建服务（最简单）
1. 删除当前失败的服务
2. 创建新的Web Service
3. 使用以下配置：
   - **Name**: `ttkh-backend-v2`
   - **Root Directory**: 留空
   - **Build Command**: `cd ttkh-tourism-system/backend && npm install`
   - **Start Command**: `cd ttkh-tourism-system/backend && npm start`

## 🎯 推荐操作步骤

### 立即修复：
1. 在Render.com中点击服务的 **Settings**
2. 找到 **Root Directory**，将其**清空**
3. 修改 **Build Command** 为: `cd ttkh-tourism-system/backend && npm install`
4. 修改 **Start Command** 为: `cd ttkh-tourism-system/backend && npm start`
5. 保存设置并重新部署

## 📱 预期结果
修复后，服务应该能够成功部署并运行在:
https://ttkh-backend.onrender.com
