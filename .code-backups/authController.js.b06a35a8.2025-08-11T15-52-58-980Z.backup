const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'auth_login.log');

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'ttkh_tourism_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password, phone, role, company_name, contact_person } = req.body;

    // 验证必填字段 - username可以从email自动生成
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码为必填项'
      });
    }

    // 如果没有提供username，从email生成
    const finalUsername = username || email.split('@')[0];

    // 获取模型实例
    const { User } = require('../models');
    
    if (!User) {
      return res.status(500).json({
        success: false,
        message: '数据库模型未初始化'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          { username: finalUsername },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建用户
    const userData = {
      username: finalUsername,
      email,
      password_hash: password,
      phone,
      role: role || 'customer',
      company_name,
      contact_person
      // 不再手动设置时间戳，让数据库默认值处理
    };

    // 明确设置状态字段，不依赖默认值
    // 普通用户直接激活，商家和代理需要审核
    if (role === 'customer') {
      userData.status = 'active'; // 客户直接激活
    } else if (role === 'merchant' || role === 'agent') {
      // 商家和代理必须设置为 pending 等待审核
      userData.status = 'pending';
    } else {
      // 其他角色默认为 active
      userData.status = 'active';
    }

    console.log('创建用户数据:', { ...userData, password_hash: '[已隐藏]' });
    const user = await User.create(userData);
    console.log('用户创建后状态:', user.status);

    // 保底：确保商家或代理的状态被设置为 pending，避免某些环境下 DB 默认覆盖导致直接 active
    if ((role === 'merchant' || role === 'agent') && user.status !== 'pending') {
      console.log('检测到商家/代理状态不是 pending，强制更新...');
      try {
        await user.update({ status: 'pending' });
        // 立即从数据库重载实例以确保拿到最新状态
        await user.reload();
        console.log('强制更新后状态:', user.status);
      } catch (e) {
        console.error('强制设置用户状态为 pending 失败:', e.message);
      }
    }

    // 确保用户对象存在并且有id
    if (!user || !user.id) {
      throw new Error('用户创建失败，无法获取用户ID');
    }

    const returnedUser = user.toSafeObject();

    // 根据角色设置不同的成功消息
    let successMessage = '注册成功';
    if (role === 'merchant' || role === 'agent') {
      successMessage = '注册成功，请等待管理员审核';
    }

    // 确保返回的用户对象是一个普通的JavaScript对象
    const safeUser = typeof returnedUser.toJSON === 'function' 
      ? returnedUser.toJSON() 
      : returnedUser;

    // 打印调试信息
    console.log('注册成功，返回用户数据:', {
      id: safeUser.id,
      username: safeUser.username,
      email: safeUser.email,
      role: safeUser.role,
      status: safeUser.status
    });

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        user: safeUser,
        needsApproval: role !== 'customer'
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginField = username || email;
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] login attempt: ${loginField}\n`); } catch(e) {}

    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名/邮箱和密码为必填项'
      });
    }

    // 获取模型实例
    const { User } = require('../models');
    const { Op } = require('sequelize');
    
    if (!User) {
      console.error('❌ User模型未初始化');
      return res.status(500).json({
        success: false,
        message: '数据库模型未初始化'
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    console.log('诊断: loginField =', loginField);
    let user;
    try {
      user = await User.findOne({
        where: {
          [Op.or]: [
            { username: loginField },
            { email: loginField }
          ]
        }
      });
      if (user) {
        console.log('诊断: 找到用户摘要', {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          hasPassword: !!user.password_hash
        });
      } else {
        console.log('诊断: 未找到匹配用户');
      }
    } catch (err) {
      console.error('诊断: 查找用户出错:', err);
      throw err;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查密码是否存在
    if (!user.password_hash) {
      console.error('诊断: 用户密码未设置', user.email);
      return res.status(400).json({
        success: false,
        message: '用户密码未设置'
      });
    }

    // 验证密码
    let isValidPassword = false;
    try {
      isValidPassword = await user.validatePassword(password);
      console.log('诊断: 密码验证结果 for', user.email, isValidPassword);
    } catch (err) {
      console.error('诊断: 密码验证出错:', err);
      return res.status(500).json({
        success: false,
        message: '密码验证失败'
      });
    }
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户状态
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: '账户待审核，请等待管理员审核'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: '账户审核未通过'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: '账户已被暂停'
      });
    }

    // 生成令牌
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: '登录成功',
      token: token,  // 确保token在顶级返回
      data: {
        user: user.toSafeObject(),
        token: token  // 同时在data中也返回
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] login exception: ${error.stack || error}\n`); } catch(e) {}
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 获取用户信息
const getProfile = async (req, res) => {
  try {
    // 获取模型实例
    const { User } = require('../models');
    
    if (!User) {
      return res.status(500).json({
        success: false,
        message: '数据库模型未初始化'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const { phone, company_name, contact_person } = req.body;
    
    // 获取模型实例
    const { User } = require('../models');
    
    if (!User) {
      return res.status(500).json({
        success: false,
        message: '数据库模型未初始化'
      });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新允许修改的字段
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (contact_person !== undefined) updateData.contact_person = contact_person;

    await user.update(updateData);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    // 在实际应用中，可以将令牌加入黑名单
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};