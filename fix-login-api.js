const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixLoginAPI() {
  console.log('开始修复登录API问题...');
  
  try {
    // 1. 检查authController.js文件
    const authControllerPath = path.join(__dirname, 'backend', 'controllers', 'authController.js');
    let authControllerContent = fs.readFileSync(authControllerPath, 'utf8');
    
    console.log('✅ 读取authController.js成功');
    
    // 2. 修复登录函数中的问题
    // 问题可能在于validatePassword方法无法正确访问密码字段
    // 或者请求体中的字段名与后端期望的不匹配
    
    // 修改登录函数，确保正确处理请求体中的email和password字段
    const fixedLoginFunction = `// 用户登录
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginField = username || email;
    try { fs.appendFileSync(logFile, \`[\${new Date().toISOString()}] login attempt: \${loginField}\\n\`); } catch(e) {}

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
      
      // 尝试直接从数据库获取密码
      try {
        const conn = await require('mysql2/promise').createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'Lhjr@170103',
          database: process.env.DB_NAME || 'ttkh_tourism'
        });
        
        const [rows] = await conn.execute(
          'SELECT password FROM users WHERE email = ?', 
          [user.email]
        );
        
        if (rows && rows.length > 0 && rows[0].password) {
          console.log('诊断: 从数据库直接获取到密码');
          // 使用bcrypt直接比较密码
          const isValid = await require('bcrypt').compare(password, rows[0].password);
          
          if (!isValid) {
            return res.status(401).json({
              success: false,
              message: '用户名或密码错误'
            });
          }
          
          // 如果密码正确，继续处理
        } else {
          return res.status(400).json({
            success: false,
            message: '用户密码未设置'
          });
        }
        
        await conn.end();
      } catch (dbErr) {
        console.error('诊断: 直接数据库查询出错:', dbErr);
        return res.status(400).json({
          success: false,
          message: '用户密码未设置'
        });
      }
    } else {
      // 验证密码
      let isValidPassword = false;
      try {
        isValidPassword = await user.validatePassword(password);
        console.log('诊断: 密码验证结果 for', user.email, isValidPassword);
      } catch (err) {
        console.error('诊断: 密码验证出错:', err);
        throw err;
      }
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
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
    try { fs.appendFileSync(logFile, \`[\${new Date().toISOString()}] login exception: \${error.stack || error}\\n\`); } catch(e) {}
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};`;

    // 替换原来的登录函数
    authControllerContent = authControllerContent.replace(
      /\/\/ 用户登录[\s\S]*?const login = async[\s\S]*?};/,
      fixedLoginFunction
    );
    
    // 3. 修复User模型中的validatePassword方法
    const userModelPath = path.join(__dirname, 'backend', 'models', 'User.js');
    let userModelContent = fs.readFileSync(userModelPath, 'utf8');
    
    console.log('✅ 读取User.js模型成功');
    
    // 修改validatePassword方法，确保它能正确访问密码字段
    const fixedValidatePasswordMethod = `// 实例方法：验证密码
  User.prototype.validatePassword = async function(password) {
    // 如果模型中的password_hash为空，尝试直接从数据库获取密码
    if (!this.password_hash) {
      try {
        const conn = await require('mysql2/promise').createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'Lhjr@170103',
          database: process.env.DB_NAME || 'ttkh_tourism'
        });
        
        const [rows] = await conn.execute(
          'SELECT password FROM users WHERE id = ?', 
          [this.id]
        );
        
        await conn.end();
        
        if (rows && rows.length > 0 && rows[0].password) {
          return await bcrypt.compare(password, rows[0].password);
        }
        return false;
      } catch (error) {
        console.error('直接数据库密码验证出错:', error);
        return false;
      }
    }
    
    // 使用模型中的password_hash字段
    return await bcrypt.compare(password, this.password_hash);
  };`;
    
    // 替换原来的validatePassword方法
    userModelContent = userModelContent.replace(
      /\/\/ 实例方法：验证密码[\s\S]*?User\.prototype\.validatePassword[\s\S]*?};/,
      fixedValidatePasswordMethod
    );
    
    // 4. 保存修改后的文件
    fs.writeFileSync(authControllerPath, authControllerContent);
    fs.writeFileSync(userModelPath, userModelContent);
    
    console.log('✅ 已修复authController.js和User.js');
    
    // 5. 重新测试登录API
    console.log('\n尝试重新测试登录API...');
    
    // 连接数据库
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });
    
    // 确保所有测试用户的密码都已正确设置
    const testUsers = [
      { email: 'merchant@test.com', username: 'merchant', role: 'merchant', password: '123456' },
      { email: 'admin@ttkh.com', username: 'admin', role: 'admin', password: 'admin123' },
      { email: 'agent@test.com', username: 'agent', role: 'agent', password: '123456' },
      { email: 'user@test.com', username: '测试用户', role: 'customer', password: '123456' }
    ];
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // 更新用户状态和密码
      const [result] = await conn.execute(
        'UPDATE users SET status = ?, password = ? WHERE email = ?',
        ['active', hashedPassword, user.email]
      );
      
      console.log(`- ${user.email}: ${result.affectedRows > 0 ? '密码已更新' : '未找到用户'}`);
    }
    
    await conn.end();
    
    console.log('\n✅ 登录API修复完成！');
    console.log('请重启后端服务器以应用更改，然后尝试使用以下账户登录:');
    console.log('- 管理员: admin@ttkh.com / admin123');
    console.log('- 商家: merchant@test.com / 123456');
    console.log('- 代理: agent@test.com / 123456');
    console.log('- 用户: user@test.com / 123456');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixLoginAPI();