const fs = require('fs').promises;

async function fixBackendPasswordMismatch() {
  console.log('🔧 修复后端密码字段不匹配问题...');
  
  try {
    // 读取后端服务器文件
    const serverPath = 'ttkh-tourism-system/backend/simple-server-fixed.js';
    let serverCode = await fs.readFile(serverPath, 'utf8');
    
    console.log('📖 读取后端服务器代码成功');
    
    // 修复注册API - 同时插入password和password_hash字段
    const oldRegisterInsert = `// 插入用户
    await pool.execute(
      \`INSERT INTO users (id, username, email, password_hash, role, company_name, contact_person, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [userId, username, email, password_hash, role, company_name || null, contact_person || null, phone || null, 'pending']
    );`;
    
    const newRegisterInsert = `// 插入用户 - 同时插入password和password_hash字段
    await pool.execute(
      \`INSERT INTO users (id, username, email, password, password_hash, role, company_name, contact_person, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [userId, username, email, password_hash, password_hash, role, company_name || null, contact_person || null, phone || null, 'pending']
    );`;
    
    if (serverCode.includes(oldRegisterInsert)) {
      serverCode = serverCode.replace(oldRegisterInsert, newRegisterInsert);
      console.log('✅ 修复注册API - 同时插入password和password_hash字段');
    }
    
    // 修复登录API - 优先使用password_hash字段，如果不存在则使用password字段
    const oldLoginPasswordCheck = `// 验证密码 - 使用正确的字段名
    if (!user.password) {
      return res.status(400).json({ success: false, message: '用户密码未设置' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);`;
    
    const newLoginPasswordCheck = `// 验证密码 - 优先使用password_hash，如果不存在则使用password
    const passwordToCheck = user.password_hash || user.password;
    if (!passwordToCheck) {
      return res.status(400).json({ success: false, message: '用户密码未设置' });
    }
    
    const isValidPassword = await bcrypt.compare(password, passwordToCheck);`;
    
    if (serverCode.includes(oldLoginPasswordCheck)) {
      serverCode = serverCode.replace(oldLoginPasswordCheck, newLoginPasswordCheck);
      console.log('✅ 修复登录API - 优先使用password_hash字段');
    }
    
    // 写入修复后的代码
    await fs.writeFile(serverPath, serverCode);
    console.log('✅ 后端服务器代码修复完成');
    
    console.log('\n🎯 修复内容:');
    console.log('1. 注册时同时插入password和password_hash字段');
    console.log('2. 登录时优先使用password_hash字段验证');
    console.log('3. 确保向后兼容性');
    
    console.log('\n⚠️ 需要重启后端服务器以应用修复');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复
fixBackendPasswordMismatch().catch(console.error);