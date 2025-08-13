const { PriceSchedule, Product } = require('../models');
const { Op } = require('sequelize');

/**
 * 创建价格日历
 * @param {Object} req - 请求对象，包含产品ID、日期、价格和库存
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回创建结果
 * @throws {Error} - 当产品不存在或参数无效时抛出错误
 */
const createPriceSchedule = async (req, res) => {
  try {
    const { product_id, date, price, available_slots } = req.body;

    // 验证必填字段
    if (!product_id || !date || price === undefined || available_slots === undefined) {
      return res.status(400).json({
        success: false,
        message: '产品ID、日期、价格和库存为必填项'
      });
    }

    // 验证产品是否存在
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: '日期格式无效，应为YYYY-MM-DD'
      });
    }

    // 检查该日期的价格记录是否已存在
    const existingSchedule = await PriceSchedule.findOne({
      where: {
        product_id,
        date
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: '该日期的价格记录已存在'
      });
    }

    // 创建价格日历记录
    const schedule = await PriceSchedule.create({
      product_id,
      date,
      price,
      available_slots
    });

    console.log(`价格日历创建成功: 产品ID=${product_id}, 日期=${date}, 价格=${price}, 库存=${available_slots}`);

    res.status(201).json({
      success: true,
      message: '价格日历创建成功',
      data: schedule
    });
  } catch (error) {
    console.error('创建价格日历错误:', error);
    res.status(500).json({
      success: false,
      message: '创建价格日历失败',
      error: error.message
    });
  }
};

/**
 * 批量创建价格日历
 * @param {Object} req - 请求对象，包含产品ID和价格日历数组
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回创建结果
 * @throws {Error} - 当产品不存在或参数无效时抛出错误
 */
const batchCreatePriceSchedules = async (req, res) => {
  try {
    const { product_id, schedules } = req.body;

    // 验证必填字段
    if (!product_id || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: '产品ID和价格日历数组为必填项'
      });
    }

    // 验证产品是否存在
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 验证每个价格日历项
    const validSchedules = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const existingDates = [];

    for (const schedule of schedules) {
      const { date, price, available_slots } = schedule;

      if (!date || price === undefined || available_slots === undefined) {
        return res.status(400).json({
          success: false,
          message: `价格日历项缺少必填字段: ${JSON.stringify(schedule)}`
        });
      }

      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: `日期格式无效: ${date}，应为YYYY-MM-DD`
        });
      }

      validSchedules.push({
        product_id,
        date,
        price,
        available_slots
      });
      existingDates.push(date);
    }

    // 检查是否有重复日期
    const dateCounts = {};
    for (const date of existingDates) {
      dateCounts[date] = (dateCounts[date] || 0) + 1;
      if (dateCounts[date] > 1) {
        return res.status(400).json({
          success: false,
          message: `价格日历包含重复日期: ${date}`
        });
      }
    }

    // 检查数据库中是否已存在相同日期的记录
    const existingSchedules = await PriceSchedule.findAll({
      where: {
        product_id,
        date: {
          [Op.in]: existingDates
        }
      }
    });

    if (existingSchedules.length > 0) {
      const existingDateStr = existingSchedules.map(s => s.date).join(', ');
      return res.status(400).json({
        success: false,
        message: `以下日期的价格记录已存在: ${existingDateStr}`
      });
    }

    // 批量创建价格日历
    const createdSchedules = await PriceSchedule.bulkCreate(validSchedules);

    console.log(`批量创建价格日历成功: 产品ID=${product_id}, 记录数=${createdSchedules.length}`);

    res.status(201).json({
      success: true,
      message: '批量创建价格日历成功',
      data: createdSchedules,
      count: createdSchedules.length
    });
  } catch (error) {
    console.error('批量创建价格日历错误:', error);
    res.status(500).json({
      success: false,
      message: '批量创建价格日历失败',
      error: error.message
    });
  }
};

/**
 * 更新价格日历
 * @param {Object} req - 请求对象，包含价格日历ID和更新信息
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回更新结果
 * @throws {Error} - 当价格日历不存在或参数无效时抛出错误
 */
const updatePriceSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, available_slots } = req.body;

    // 验证更新字段
    if (price === undefined && available_slots === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供价格或库存'
      });
    }

    // 查找价格日历
    const schedule = await PriceSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '价格日历不存在'
      });
    }

    // 更新价格日历
    const updates = {};
    if (price !== undefined) updates.price = price;
    if (available_slots !== undefined) updates.available_slots = available_slots;

    await schedule.update(updates);

    console.log(`价格日历更新成功: ID=${id}`);

    res.json({
      success: true,
      message: '价格日历更新成功',
      data: schedule
    });
  } catch (error) {
    console.error('更新价格日历错误:', error);
    res.status(500).json({
      success: false,
      message: '更新价格日历失败',
      error: error.message
    });
  }
};

/**
 * 删除价格日历
 * @param {Object} req - 请求对象，包含价格日历ID
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回删除结果
 * @throws {Error} - 当价格日历不存在时抛出错误
 */
const deletePriceSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找价格日历
    const schedule = await PriceSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '价格日历不存在'
      });
    }

    // 删除价格日历
    await schedule.destroy();

    console.log(`价格日历删除成功: ID=${id}`);

    res.json({
      success: true,
      message: '价格日历删除成功'
    });
  } catch (error) {
    console.error('删除价格日历错误:', error);
    res.status(500).json({
      success: false,
      message: '删除价格日历失败',
      error: error.message
    });
  }
};

/**
 * 获取产品的价格日历
 * @param {Object} req - 请求对象，包含产品ID
 * @param {Object} res - 响应对象
 * @returns {Promise<void>} - 返回价格日历列表
 * @throws {Error} - 当产品不存在时抛出错误
 */
const getPriceSchedulesByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { start_date, end_date } = req.query;

    // 验证产品是否存在
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 构建查询条件
    const where = { product_id };
    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.date = {
        [Op.lte]: end_date
      };
    }

    // 查询价格日历
    const schedules = await PriceSchedule.findAll({
      where,
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    console.error('获取产品价格日历错误:', error);
    res.status(500).json({
      success: false,
      message: '获取产品价格日历失败',
      error: error.message
    });
  }
};

module.exports = {
  createPriceSchedule,
  batchCreatePriceSchedules,
  updatePriceSchedule,
  deletePriceSchedule,
  getPriceSchedulesByProduct
};