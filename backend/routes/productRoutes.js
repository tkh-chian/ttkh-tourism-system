const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const priceScheduleController = require('../controllers/priceScheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// 公共产品接口
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// 商家产品接口（需要认证和商家权限）
router.post('/', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  productController.createProduct
);
router.put('/:id', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  productController.updateProduct
);
router.post('/:id/submit', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  productController.submitForReview
);
router.get('/merchant/my-products', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  productController.getMerchantProducts
);

// 价格日历接口（需要认证和商家权限）
router.post('/price-schedules', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  priceScheduleController.createPriceSchedule
);
router.post('/price-schedules/batch', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  priceScheduleController.batchCreatePriceSchedules
);
router.put('/price-schedules/:id', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  priceScheduleController.updatePriceSchedule
);
router.delete('/price-schedules/:id', 
  authMiddleware.authenticate, 
  roleMiddleware.restrictTo('merchant'), 
  priceScheduleController.deletePriceSchedule
);
router.get('/:product_id/price-schedules', 
  priceScheduleController.getPriceSchedulesByProduct
);

module.exports = router;