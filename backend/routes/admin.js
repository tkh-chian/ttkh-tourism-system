const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// 所有管理员路由都需要管理员权限
router.use(authenticateToken);
router.use(checkRole(['admin']));

// 用户管理
router.get('/users', adminController.getAllUsers);
router.get('/users/pending', adminController.getPendingUsers);
router.put('/users/:id/review', adminController.reviewUser);
router.put('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/status', adminController.updateUserStatus); // 添加PATCH方法支持

// 商家管理 - 专门的商家端点
router.get('/merchants', adminController.getMerchants);
router.put('/merchants/:id/approve', adminController.reviewUser);

// 产品管理
router.get('/products', adminController.getProducts);
router.get('/products/pending', adminController.getPendingProducts);
router.put('/products/:id/review', adminController.reviewProduct);
router.put('/products/:id/approve', adminController.reviewProduct);
router.put('/products/:id/status', adminController.updateProductStatus);

// 订单管理
router.get('/orders', adminController.getOrders);

// 系统统计
router.get('/stats', adminController.getSystemStats);

module.exports = router;
