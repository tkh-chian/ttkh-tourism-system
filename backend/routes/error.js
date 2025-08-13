const express = require('express');
const router = express.Router();

// 处理前端错误上报
router.post('/browser-error', (req, res) => {
  try {
    const errorData = req.body;
    
    // 过滤心跳消息，避免日志过多
    if (errorData.type === 'Heartbeat') {
      return res.status(200).json({ status: 'ok', message: 'Heartbeat received' });
    }
    
    // 记录错误信息
    console.log('🚨 前端错误上报:', {
      type: errorData.type,
      message: errorData.message,
      source: errorData.source,
      url: errorData.url,
      timestamp: errorData.timestamp,
      userAgent: errorData.userAgent
    });
    
    // 这里可以添加更多的错误处理逻辑，比如：
    // - 保存到数据库
    // - 发送邮件通知
    // - 集成第三方错误监控服务
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Error reported successfully' 
    });
    
  } catch (error) {
    console.error('❌ 处理错误上报失败:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process error report' 
    });
  }
});

module.exports = router;