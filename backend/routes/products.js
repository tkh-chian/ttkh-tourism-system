const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 创建 multer 实例
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为10MB
});

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  submitForReview,
  getMerchantProducts,
  unpublishProduct,
  deleteProduct
} = require('../controllers/productController');
const { getProductSchedules, setSingleSchedule, batchSetSchedules, deleteSchedule } = require('../controllers/scheduleController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 公开路由 - 获取产品列表
router.get('/', getProducts);

// 公开路由 - 获取产品列表（别名）
router.get('/public', getProducts);

// 获取特定产品的价格日程（公开接口）
router.get('/:id/schedules', getProductSchedules);

// 创建/更新单个价格日程（商家权限）
router.post('/:id/schedules', authenticateToken, requireRole(['merchant', 'admin']), setSingleSchedule);

// 批量创建/更新价格日程（商家权限）
router.post('/:id/schedules/batch', authenticateToken, requireRole(['merchant', 'admin']), batchSetSchedules);

// 删除价格日程（商家权限）
router.delete('/:id/schedules/:date', authenticateToken, requireRole(['merchant', 'admin']), deleteSchedule);

// 获取商家自己的产品列表 - 需要认证
router.get('/merchant/my-products', authenticateToken, requireRole(['merchant', 'admin']), getMerchantProducts);

// 公开路由 - 获取产品详情 (放在认证路由之后，避免与认证路由冲突)
router.get('/:id', getProductById);

// 创建产品 - 商家权限 (使用 multer 处理文件上传)
router.post('/', authenticateToken, requireRole(['merchant', 'admin']), upload.fields([
  { name: 'poster_image', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]), (req, res, next) => {
  // 处理上传的文件，将文件路径添加到请求体
  if (req.files) {
    if (req.files.poster_image && req.files.poster_image[0]) {
      req.body.poster_image = '/uploads/' + path.basename(req.files.poster_image[0].path);
      req.body.poster_filename = req.files.poster_image[0].originalname;
    }
    if (req.files.pdf_file && req.files.pdf_file[0]) {
      req.body.pdf_file = '/uploads/' + path.basename(req.files.pdf_file[0].path);
      req.body.pdf_filename = req.files.pdf_file[0].originalname;
    }
  }
  next();
}, createProduct);

// 更新产品 - 商家权限
router.put('/:id', authenticateToken, requireRole(['merchant', 'admin']), updateProduct);

// 提交产品审核 - 商家权限
router.put('/:id/submit', authenticateToken, requireRole(['merchant', 'admin']), submitForReview);

// 删除产品 - 商家权限
router.delete('/:id', authenticateToken, requireRole(['merchant', 'admin']), deleteProduct);

module.exports = router;