const { User, Product, Order, PriceSchedule } = require('../models');

// 获取用户列表
const getUsers = async (req, res) => {
  try {const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 添加搜索条件
    if (search) {
      where[User.sequelize.Sequelize.Op.or] = [
        { username: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { email: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { company_name: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // 添加角色筛选
    if (role) {
      where.role = role;
    }

    // 添加状态筛选
    if (status) {
      where.status = status;
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order.toUpperCase()]]
    });

    // 向后兼容：当通过 query 参数 status=pending 请求时，返回 { data: { users } } 结构，供旧测试脚本使用
    if (status === 'pending') {
      res.json({
        success: true,
        data: {
          users: users.rows
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.count,
          totalPages: Math.ceil(users.count / limit)
        }
      });
    } else {
      res.json({
        success: true,
        data: users.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.count,
          totalPages: Math.ceil(users.count / limit)
        }
      });
    }
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

// 更新用户状态
const updateUserStatus = async (req, res) => {
  try {const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供用户状态'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户状态'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能修改管理员状态
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '不能修改管理员状态'
      });
    }

    await user.update({ status });

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      error: error.message
    });
  }
};

// 获取产品列表（管理员）
const getProducts = async (req, res) => {
  try {const {
      page = 1,
      limit = 10,
      search,
      status,
      merchant_id,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 添加搜索条件
    if (search) {
      where[Product.sequelize.Sequelize.Op.or] = [
        { title_zh: { [Product.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { title_th: { [Product.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // 添加状态筛选
    if (status) {
      where.status = status;
    }

    // 添加商家筛选
    if (merchant_id) {
      where.merchant_id = merchant_id;
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username', 'company_name', 'contact_person']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', order.toUpperCase()]],
      distinct: true
    });

    res.json({
      success: true,
      data: products.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.count,
        totalPages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
};

// 审核产品 - 通过
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    await product.update({ status: 'approved' });

    res.json({
      success: true,
      message: '产品审核通过',
      data: product
    });
  } catch (error) {
    console.error('产品审核通过错误:', error);
    res.status(500).json({
      success: false,
      message: '产品审核通过失败',
      error: error.message
    });
  }
};


// 拒绝产品
const rejectProduct = async (req, res) => {
  try {const { id } = req.params;
    const { reason } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    await product.update({ 
      status: 'rejected',
      rejection_reason: reason 
    });

    res.json({
      success: true,
      message: '产品已拒绝',
      data: product
    });
  } catch (error) {
    console.error('拒绝产品错误:', error);
    res.status(500).json({
      success: false,
      message: '拒绝产品失败',
      error: error.message
    });
  }
};

// 获取订单列表（管理员）
const getOrders = async (req, res) => {
  try {const {
      page = 1,
      limit = 10,
      status,
      payment_status,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 添加状态筛选
    if (status) {
      where.status = status;
    }

    // 添加支付状态筛选
    if (payment_status) {
      where.payment_status = payment_status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title_zh', 'title_th', 'poster_image']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'username', 'email', 'phone']
        },
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username', 'company_name', 'contact_person']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'username', 'company_name', 'contact_person'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order.toUpperCase()]],
      distinct: true
    });

    res.json({
      success: true,
      data: orders.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.count,
        totalPages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
};

// 获取统计数据
const getStatistics = async (req, res) => {
  try {// 用户统计
    const userStats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    // 产品统计
    const productStats = await Product.findAll({
      attributes: [
        'status',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // 订单统计
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count'],
        [Order.sequelize.fn('SUM', Order.sequelize.col('total_amount')), 'total_amount']
      ],
      group: ['status']
    });

    // 总收入
    const totalRevenue = await Order.sum('total_amount', {
      where: {
        payment_status: 'paid'
      }
    });

    // 本月收入
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.sum('total_amount', {
      where: {
        payment_status: 'paid',
        created_at: {
          [Order.sequelize.Sequelize.Op.gte]: thisMonth
        }
      }
    });

    res.json({
      success: true,
      data: {
        users: userStats.reduce((acc, stat) => {
          acc[stat.role] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        products: productStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        orders: orderStats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: parseInt(stat.dataValues.count),
            total_amount: parseFloat(stat.dataValues.total_amount || 0)
          };
          return acc;
        }, {}),
        revenue: {
          total: totalRevenue || 0,
          thisMonth: monthlyRevenue || 0
        }
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

// 获取待审核用户
const getPendingUsers = async (req, res) => {
  try {const users = await User.findAll({
      where: { status: 'pending' },
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('获取待审核用户错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核用户失败',
      error: error.message
    });
  }
};

// 审核用户
const reviewUser = async (req, res) => {
  try {const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({ 
      status,
      rejection_reason: status === 'rejected' ? reason : null
    });

    res.json({
      success: true,
      message: `用户${status === 'approved' ? '审核通过' : '审核拒绝'}`,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('审核用户错误:', error);
    res.status(500).json({
      success: false,
      message: '审核用户失败',
      error: error.message
    });
  }
};

// 获取待审核产品
const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username', 'company_name', 'contact_person']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('获取待审核产品错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核产品失败',
      error: error.message
    });
  }
};

 // 审核产品（兼容 status 或 action）
const reviewProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, action, reason } = req.body;

    // 如果传递了 action（例如 { action: 'approve' }），将其转换为 status
    if (!status && action) {
      if (action === 'approve') status = 'approved';
      if (action === 'reject' || action === 'reject_product') status = 'rejected';
    }

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    await product.update({
      status,
      rejection_reason: status === 'rejected' ? reason : null
    });

    res.json({
      success: true,
      message: `产品${status === 'approved' ? '审核通过' : '审核拒绝'}`,
      data: product
    });
  } catch (error) {
    console.error('审核产品错误:', error);
    res.status(500).json({
      success: false,
      message: '审核产品失败',
      error: error.message
    });
  }
};

// 获取商家列表 - 专门的商家端点
const getMerchants = async (req, res) => {
  try {
    console.log('🏪 getMerchants API被调用');
    
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { role: 'merchant' }; // 商家用户的角色是 'merchant'

    console.log('🔍 查询条件:', where);

    // 添加搜索条件
    if (search) {
      where[User.sequelize.Sequelize.Op.or] = [
        { username: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { email: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { company_name: { [User.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // 添加状态筛选
    if (status) {
      where.status = status;
    }

    const merchants = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order.toUpperCase()]]
    });

    console.log('📊 查询结果:', {
      count: merchants.count,
      rows: merchants.rows.length,
      firstMerchant: merchants.rows[0] ? {
        id: merchants.rows[0].id,
        username: merchants.rows[0].username,
        role: merchants.rows[0].role,
        status: merchants.rows[0].status
      } : null
    });

    // 修复：确保返回的是数组格式
    const merchantsArray = merchants.rows.map(merchant => {
      // 确保每个商家对象都是普通JavaScript对象，而不是Sequelize实例
      return typeof merchant.toJSON === 'function' ? merchant.toJSON() : merchant;
    });
    
    // 打印调试信息
    console.log('🔍 处理后的商家数组:', {
      isArray: Array.isArray(merchantsArray),
      length: merchantsArray.length,
      firstItem: merchantsArray.length > 0 ? {
        id: merchantsArray[0].id,
        username: merchantsArray[0].username
      } : null
    });
    
    // 返回与前端期望格式匹配的数据结构
    res.json({
      success: true,
      data: {
        users: merchantsArray  // 前端期望 data.users 结构
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: merchants.count,
        totalPages: Math.ceil(merchants.count / limit)
      }
    });
  } catch (error) {
    console.error('❌ 获取商家列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家列表失败',
      error: error.message
    });
  }
};

// 更新产品状态
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供产品状态'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的产品状态'
      });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    await product.update({ 
      status,
      rejection_reason: status === 'rejected' ? reason : null
    });

    res.json({
      success: true,
      message: '产品状态更新成功',
      data: product
    });
  } catch (error) {
    console.error('更新产品状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新产品状态失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers: getUsers,
  getUsers,  // 添加 getUsers 方法
  getPendingUsers,
  reviewUser,
  updateUserStatus,
  getProducts,
  getPendingProducts,
  reviewProduct,
  approveProduct,
  rejectProduct,
  updateProductStatus,  // 添加新的产品状态更新方法
  getOrders,
  getSystemStats: getStatistics,
  getMerchants  // 添加新的商家端点
};
