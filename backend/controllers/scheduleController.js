const { User, Product, Order, PriceSchedule } = require('../models');
// 获取模型实例
// 获取产品的价格日程
const getProductSchedules = async (req, res) => {
  try {const { id } = req.params;
    const { start_date, end_date } = req.query;

    // 验证产品是否存在
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    const whereClause = { product_id: id };

    // 添加日期范围筛选
    if (start_date || end_date) {
      whereClause.date = {};
      if (start_date) {
        whereClause.date[PriceSchedule.sequelize.Sequelize.Op.gte] = start_date;
      }
      if (end_date) {
        whereClause.date[PriceSchedule.sequelize.Sequelize.Op.lte] = end_date;
      }
    }

    const schedules = await PriceSchedule.findAll({
      where: whereClause,
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('获取价格日程错误:', error);
    res.status(500).json({
      success: false,
      message: '获取价格日程失败',
      error: error.message
    });
  }
};

// 设置单个价格日程
const setSingleSchedule = async (req, res) => {
  try {const { id } = req.params;
    const { travel_date, price, available_stock } = req.body;

    // 验证必填字段
    if (!travel_date || !price || available_stock === undefined) {
      return res.status(400).json({
        success: false,
        message: '出行日期、价格和可用库存为必填项'
      });
    }

    // 验证产品是否存在
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 权限检查：只有产品所有者可以设置价格日程
    if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此产品'
      });
    }

    // 查找或创建价格日程
    const [schedule, created] = await PriceSchedule.findOrCreate({
      where: {
        product_id: id,
        date: travel_date
      },
      defaults: {
        product_id: id,
        date: travel_date,
        price,
        available_stock
      }
    });

    // 如果已存在，则更新
    if (!created) {
      await schedule.update({
        price,
        available_stock
      });
    }

    res.json({
      success: true,
      message: created ? '价格日程创建成功' : '价格日程更新成功',
      data: schedule
    });
  } catch (error) {
    console.error('设置价格日程错误:', error);
    res.status(500).json({
      success: false,
      message: '设置价格日程失败',
      error: error.message
    });
  }
};

// 批量设置价格日程
const batchSetSchedules = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    // 验证必填字段
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的价格日程数据'
      });
    }

    // 验证产品是否存在
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 权限检查
    if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此产品'
      });
    }

    const results = [];
    const errors = [];

    // 批量处理每个日程
    for (const scheduleData of schedules) {
      try {
        const { date, price, stock } = scheduleData;

        if (!date || !price || stock === undefined) {
          errors.push({
            date,
            error: '出行日期、价格和库存为必填项'
          });
          continue;
        }

        const [schedule, created] = await PriceSchedule.findOrCreate({
          where: {
            product_id: id,
            date: date
          },
          defaults: {
            product_id: id,
            date: date,
            price: price,
            total_stock: stock
          }
        });

        if (!created) {
          await schedule.update({
            price: price,
            total_stock: stock
          });
        }

        results.push({
          date,
          status: created ? 'created' : 'updated',
          data: schedule
        });
      } catch (error) {
        errors.push({
          date: scheduleData.date,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `批量设置完成，成功处理 ${results.length} 条记录`,
      data: {
        results,
        errors
      }
    });
  } catch (error) {
    console.error('批量设置价格日程错误:', error);
    res.status(500).json({
      success: false,
      message: '批量设置价格日程失败',
      error: error.message
    });
  }
};

// 删除价格日程
const deleteSchedule = async (req, res) => {
  try {const { id, date } = req.params;

    // 验证产品是否存在
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 权限检查
    if (req.user.role === 'merchant' && product.merchant_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此产品'
      });
    }

    // 查找价格日程
    const schedule = await PriceSchedule.findOne({
      where: {
        product_id: id,
        date: date
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '价格日程不存在'
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: '价格日程删除成功'
    });
  } catch (error) {
    console.error('删除价格日程错误:', error);
    res.status(500).json({
      success: false,
      message: '删除价格日程失败',
      error: error.message
    });
  }
};

module.exports = {
  getProductSchedules,
  setSingleSchedule,
  batchSetSchedules,
  deleteSchedule
};