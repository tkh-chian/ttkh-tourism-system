const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 错误收集端点
app.post('/debug/error', (req, res) => {
  const { error, url, userAgent, timestamp, stack } = req.body;
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    error,
    url,
    userAgent,
    stack,
    id: Date.now()
  };
  
  // 保存到文件
  const logFile = path.join(__dirname, 'frontend-errors.json');
  let errors = [];
  
  if (fs.existsSync(logFile)) {
    try {
      errors = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    } catch (e) {
      errors = [];
    }
  }
  
  errors.unshift(errorLog);
  errors = errors.slice(0, 100); // 只保留最新100条
  
  fs.writeFileSync(logFile, JSON.stringify(errors, null, 2));
  
  console.log('🚨 前端错误:', error);
  console.log('📍 页面:', url);
  console.log('📊 堆栈:', stack);
  console.log('---');
  
  res.json({ success: true });
});

// 获取错误列表
app.get('/debug/errors', (req, res) => {
  const logFile = path.join(__dirname, 'frontend-errors.json');
  let errors = [];
  
  if (fs.existsSync(logFile)) {
    try {
      errors = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    } catch (e) {
      errors = [];
    }
  }
  
  res.json(errors);
});

// 清除错误日志
app.delete('/debug/errors', (req, res) => {
  const logFile = path.join(__dirname, 'frontend-errors.json');
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }
  res.json({ success: true });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🔍 实时错误监控服务启动: http://localhost:${PORT}`);
  console.log('📊 查看错误: http://localhost:3002/debug/errors');
});