const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// 所有订单接口都需要认证
router.use(authMiddleware.authenticate);

// 创建订单
router.post('/', orderController.createOrder);

// 获取当前用户的订单列表
router.get('/', orderController.getOrders);

// 获取订单详情
router.get('/:id', orderController.getOrderById);

// 商家获取自己的订单
router.get('/merchant', 
  roleMiddleware.restrictTo('merchant'), 
  orderController.getMerchantOrders
);

// 管理员获取所有订单
router.get('/admin/all', 
  roleMiddleware.restrictTo('admin'), 
  orderController.getAllOrders
);

// 更新订单状态
router.patch('/:id/status', 
  roleMiddleware.restrictTo('admin', 'merchant'), 
  orderController.updateOrderStatus
);

module.exports = router;