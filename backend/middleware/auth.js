const jwt = require('jsonwebtoken');

// 认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ttkh_tourism_secret_key_2024');
    
    // 获取模型实例
    const { User } = require('../models');
    
    if (!User) {
      return res.status(500).json({
        success: false,
        message: '数据库模型未初始化'
      });
    }

    // 查找用户 (支持userId或id字段)
    const userId = decoded.userId || decoded.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查用户状态（商家允许在 pending 状态上传产品）
    if (user.role !== 'merchant' && !['active', 'approved'].includes(user.status)) {
      return res.status(403).json({
        success: false,
        message: '账户未激活或已被暂停'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

// 角色权限中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

// 管理员权限中间件
const requireAdmin = requireRole(['admin']);

// 商家权限中间件
const requireMerchant = requireRole(['merchant', 'admin']);

// 代理权限中间件
const requireAgent = requireRole(['agent', 'admin']);

// 商家或代理权限中间件
const requireMerchantOrAgent = requireRole(['merchant', 'agent', 'admin']);

// 检查角色权限（别名函数，兼容旧代码）
const checkRole = (roles) => {
  return requireRole(roles);
};

// 检查资源所有权中间件
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { Product, Order } = require('../models');
      const { id } = req.params;
      
      if (req.user.role === 'admin') {
        // 管理员可以访问所有资源
        return next();
      }

      if (resourceType === 'product') {
        if (!Product) {
          return res.status(500).json({
            success: false,
            message: '数据库模型未初始化'
          });
        }

        const product = await Product.findByPk(id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: '产品不存在'
          });
        }

        if (product.merchant_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: '无权限访问此资源'
          });
        }
      } else if (resourceType === 'order') {
        if (!Order) {
          return res.status(500).json({
            success: false,
            message: '数据库模型未初始化'
          });
        }

        const order = await Order.findByPk(id);
        if (!order) {
          return res.status(404).json({
            success: false,
            message: '订单不存在'
          });
        }

        // 检查是否是订单的客户、商家或代理
        if (order.customer_id !== req.user.id && 
            order.merchant_id !== req.user.id && 
            order.agent_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: '无权限访问此资源'
          });
        }
      }

      next();
    } catch (error) {
      console.error('检查资源所有权错误:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireMerchant,
  requireAgent,
  requireMerchantOrAgent,
  checkRole,
  checkOwnership
};