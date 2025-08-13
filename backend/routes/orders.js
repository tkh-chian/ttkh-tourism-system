const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// 所有订单相关路由都需要认证
router.use(authenticateToken);

// 创建订单（客户和代理）
router.post('/', 
  checkRole(['customer', 'agent', 'admin', 'user']), 
  orderController.createOrder
);

// 获取订单列表
router.get('/', orderController.getOrders);

// 获取商家订单列表（必须放在 /:id 之前）
router.get('/merchant',
  checkRole(['merchant', 'admin']),
  orderController.getMerchantOrders
);

// 获取订单详情
router.get('/:id', orderController.getOrderById);

// 更新订单状态（商家和管理员）
router.put('/:id/status', 
  checkRole(['merchant', 'admin']), 
  orderController.updateOrderStatus
);

// 上传付款截图（客户和代理）
router.post('/:id/payment', 
  checkRole(['customer', 'agent', 'admin']), 
  orderController.uploadPaymentScreenshot
);

// 上传返回PDF（商家和管理员）
router.post('/:id/return-file', 
  checkRole(['merchant', 'admin']), 
  orderController.uploadReturnFile
);

module.exports = router;
