const { User, Product, Order, PriceSchedule } = require('../models');
const { v4: uuidv4 } = require('uuid');

// 创建订单
const createOrder = async (req, res) => {
  try {
    const {
      product_id,
      merchant_id,
      product_title,
      travel_date,
      adults,
      children_no_bed,
      total_people,
      unit_price,
      total_price,
      customer_name,
      notes
    } = req.body;

    // 检查必填字段
    if (!product_id || !travel_date || !adults || !total_price || !customer_name) {
      return res.status(400).json({
        success: false,
        message: '产品ID、出行日期、成人数量、总金额和客户姓名为必填项'
      });
    }

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 如果没有提供商家ID，使用产品中的商家ID
    const merchantId = merchant_id || product.merchant_id;
    // 如果没有提供产品标题，使用产品中的标题
    const productTitle = product_title || product.title_zh || product.name;
    // 如果没有提供总人数，使用成人数量
    const totalPeople = total_people || adults;
    // 如果没有提供单价，从总价和总人数计算
    const unitPrice = unit_price || (total_price / totalPeople);

    // 检查并更新库存
    // 确保日期格式正确，避免时区问题
    const formattedDate = travel_date.includes('T') 
      ? travel_date.split('T')[0] 
      : travel_date;
      
    console.log('查询价格日历使用的日期:', formattedDate);
    
    const schedule = await PriceSchedule.findOne({
      where: {
        product_id,
        travel_date: formattedDate
      }
    });

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: '所选日期没有可用库存'
      });
    }

    if (schedule.available_stock < adults) {
      return res.status(400).json({
        success: false,
        message: '库存不足，当前可用库存: ' + schedule.available_stock
      });
    }

    // 更新库存
    await schedule.update({
      available_stock: schedule.available_stock - adults
    });

    // 生成唯一订单编号: TTK-时间戳-随机字符串
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    let orderNumber = `TTK${timestamp}${randomStr}`;

    // 验证唯一性并带重试机制
    const maxRetries = 3;
    let retryCount = 0;
    let isUnique = false;

    while (!isUnique && retryCount < maxRetries) {
      const existingOrder = await Order.findOne({ where: { order_number: orderNumber } });
      if (existingOrder) {
        retryCount++;
        const newRandomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
        orderNumber = `TTK${timestamp}${newRandomStr}`;
      } else {
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new Error('无法生成唯一订单编号，请稍后重试');
    }

    const order = await Order.create({
      id: uuidv4(), // 添加UUID作为主键
      order_number: orderNumber,
      customer_id: req.user.id,
      product_id,
      merchant_id: merchantId,
      product_title: productTitle,
      travel_date,
      adults,
      children_no_bed,
      total_people: totalPeople,
      unit_price: unitPrice,
      total_price,
      customer_name,
      notes,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          product_id: order.product_id,
          travel_date: order.travel_date,
          adults: order.adults,
          children_no_bed: order.children_no_bed,
          total_price: order.total_price,
          customer_name: order.customer_name,
          status: order.status,
          createdAt: order.createdAt
        },
        orderId: order.id,
        orderNumber: order.order_number
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    return res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
};

// 获取订单列表
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (req.user.role === 'customer' || req.user.role === 'user') {
      whereClause.customer_id = req.user.id;
    } else if (req.user.role === 'merchant') {
      const merchantProducts = await Product.findAll({
        where: { merchant_id: req.user.id },
        attributes: ['id']
      });
      const productIds = merchantProducts.map(p => p.id);
      whereClause.product_id = { [Order.sequelize.Sequelize.Op.in]: productIds };
    }
    // 管理员可以看到所有订单，不添加额外的where条件

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Product, 
          as: 'product', 
          attributes: ['id', 'name', 'title_zh'],
          required: false
        },
        { 
          model: User, 
          as: 'customer', 
          attributes: ['id', 'username'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const orders = rows.map(order => ({
      orderId: order.id,
      orderNumber: order.order_number,
      productId: order.product ? order.product.id : order.product_id,
      product_title: order.product ? (order.product.name || order.product.title_zh) : order.product_title,
      travel_date: order.travel_date,
      adults: order.adults || 0,
      children_no_bed: (order.children_no_bed || 0) + (order.children_with_bed || 0),
      total_price: order.total_price,
      customer_name: order.customer_name || (order.customer ? order.customer.username : '未知客户'),
      status: order.status,
      created_at: order.createdAt
    }));

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
};

// 获取订单详情
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'merchant_id', 'name', 'title_zh']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'username', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此订单'
      });
    }

    if (req.user.role === 'merchant' && order.product && order.product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此订单'
      });
    }

    return res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
};

// 更新订单状态
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供订单状态'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'paid', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单状态'
      });
    }

    const order = await Order.findByPk(id, {
      include: [{ 
        model: Product, 
        as: 'product',
        attributes: ['id', 'merchant_id', 'name', 'title_zh']
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (req.user.role === 'merchant' && order.product && order.product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单'
      });
    }

    await order.update({ status });

    return res.json({
      success: true,
      message: '订单状态更新成功',
      data: { order }
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    return res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error.message
    });
  }
};

// 上传付款截图
const uploadPaymentScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_screenshot, payment_filename } = req.body;

    if (!payment_screenshot) {
      return res.status(400).json({
        success: false,
        message: '请提供付款截图'
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单'
      });
    }

    await order.update({
      payment_screenshot,
      payment_filename,
      payment_status: 'uploaded'
    });

    return res.json({
      success: true,
      message: '付款截图上传成功',
      data: { order }
    });
  } catch (error) {
    console.error('上传付款截图错误:', error);
    return res.status(500).json({
      success: false,
      message: '上传付款截图失败',
      error: error.message
    });
  }
};

// 上传返回PDF
const uploadReturnPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { return_pdf, return_filename } = req.body;

    if (!return_pdf) {
      return res.status(400).json({
        success: false,
        message: '请提供返回PDF文件'
      });
    }

    const order = await Order.findByPk(id, {
      include: [{ 
        model: Product, 
        as: 'product',
        attributes: ['id', 'merchant_id', 'name', 'title_zh']
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (req.user.role === 'merchant' && order.product && order.product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单'
      });
    }

    await order.update({
      return_pdf,
      return_filename
    });

    return res.json({
      success: true,
      message: '返回PDF上传成功',
      data: { order }
    });
  } catch (error) {
    console.error('上传返回PDF错误:', error);
    return res.status(500).json({
      success: false,
      message: '上传返回PDF失败',
      error: error.message
    });
  }
};

/**
 * 获取商家订单列表
 * @param {Object} req - 请求对象，包含商家用户信息
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回商家订单列表
 * @throws {Error} - 当数据库查询失败时抛出错误
 */
const getMerchantOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    // 获取商家的所有产品ID
    const merchantProducts = await Product.findAll({
      where: { merchant_id: req.user.id },
      attributes: ['id']
    });
    const productIds = merchantProducts.map(p => p.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: {
          orders: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        }
      });
    }

    whereClause.product_id = { [Order.sequelize.Sequelize.Op.in]: productIds };
    if (status) whereClause.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Product, 
          as: 'product',
          attributes: ['id', 'name', 'title_zh', 'title_th'],
          required: false
        },
        { 
          model: User, 
          as: 'customer',
          attributes: ['id', 'username', 'phone'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const orders = rows.map(order => ({
      orderId: order.id,
      orderNumber: order.order_number,
      productId: order.product ? order.product.id : order.product_id,
      productTitle: order.product ? (order.product.name || order.product.title_zh) : order.product_title,
      travelDate: order.travel_date,
      adultCount: order.adults || 0,
      childCount: (order.children_no_bed || 0) + (order.children_with_bed || 0),
      totalAmount: order.total_price,
      customerName: order.customer_name || (order.customer ? order.customer.username : '未知客户'),
      status: order.status,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家订单失败',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  uploadPaymentScreenshot,
  uploadReturnFile: uploadReturnPdf,
  getMerchantOrders
};