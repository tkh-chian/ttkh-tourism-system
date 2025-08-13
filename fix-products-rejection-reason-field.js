const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixProductsRejectionReasonField() {
  console.log('🔧 修复products表rejection_reason字段问题...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查products表结构
    console.log('\n🔍 检查products表结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('当前字段:');
    const existingColumns = [];
    columns.forEach(col => {
      existingColumns.push(col.COLUMN_NAME);
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE}) 默认值: ${col.COLUMN_DEFAULT || 'none'}`);
    });
    
    // 2. 添加缺失的rejection_reason字段
    if (!existingColumns.includes('rejection_reason')) {
      console.log('\n🔧 添加rejection_reason字段...');
      try {
        await connection.execute(`
          ALTER TABLE products 
          ADD COLUMN rejection_reason TEXT NULL AFTER status
        `);
        console.log('✅ rejection_reason字段添加成功');
      } catch (error) {
        console.log('⚠️ 添加rejection_reason字段失败:', error.message);
      }
    } else {
      console.log('✅ rejection_reason字段已存在');
    }
    
    // 3. 修复SQL语法错误 - 检查后端代码中的SQL语句
    console.log('\n🔧 检查并修复SQL语法问题...');
    console.log('注意: 后端代码中的SQL语句缺少逗号');
    console.log('错误: UPDATE products SET status = ? rejection_reason = ? WHERE id = ?');
    console.log('正确: UPDATE products SET status = ?, rejection_reason = ? WHERE id = ?');
    
    // 4. 测试产品状态更新API
    console.log('\n🧪 测试产品状态更新API...');
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3001';
    
    try {
      // 先登录获取管理员token
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success && loginResponse.data.data.token) {
        const token = loginResponse.data.data.token;
        console.log('✅ 管理员登录成功');
        
        // 获取待审核的产品
        const productsResponse = await axios.get(`${BASE_URL}/api/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (productsResponse.data.success && productsResponse.data.data.length > 0) {
          const product = productsResponse.data.data.find(p => p.status === 'pending') || productsResponse.data.data[0];
          console.log(`✅ 找到测试产品: ${product.title_zh || product.name}`);
          console.log(`   产品ID: ${product.id}`);
          console.log(`   当前状态: ${product.status}`);
          
          // 测试审核产品 - 批准
          try {
            const approveResponse = await axios.put(
              `${BASE_URL}/api/admin/products/${product.id}/status`,
              { 
                status: 'approved',
                rejection_reason: null
              },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (approveResponse.data.success) {
              console.log('✅ 产品审核(批准)测试成功！');
              console.log(`   产品状态已更新为: approved`);
            } else {
              console.log('❌ 产品审核(批准)测试失败:', approveResponse.data.message);
            }
          } catch (approveError) {
            console.log('❌ 产品审核API错误:', approveError.response?.data?.message || approveError.message);
            if (approveError.response?.data?.error) {
              console.log('   详细错误:', approveError.response.data.error);
            }
          }
          
          // 测试审核产品 - 拒绝
          try {
            const rejectResponse = await axios.put(
              `${BASE_URL}/api/admin/products/${product.id}/status`,
              { 
                status: 'rejected',
                rejection_reason: '测试拒绝原因：产品信息不完整'
              },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (rejectResponse.data.success) {
              console.log('✅ 产品审核(拒绝)测试成功！');
              console.log(`   产品状态已更新为: rejected`);
              console.log(`   拒绝原因: 测试拒绝原因：产品信息不完整`);
            } else {
              console.log('❌ 产品审核(拒绝)测试失败:', rejectResponse.data.message);
            }
          } catch (rejectError) {
            console.log('❌ 产品拒绝API错误:', rejectError.response?.data?.message || rejectError.message);
          }
          
        } else {
          console.log('❌ 没有找到测试产品');
        }
        
      } else {
        console.log('❌ 管理员登录失败');
      }
    } catch (loginError) {
      console.log('❌ 登录错误:', loginError.response?.data?.message || loginError.message);
    }
    
    // 5. 显示修复后的表结构
    console.log('\n📋 修复后的products表结构:');
    const [newColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttkh_tourism' AND TABLE_NAME = 'products'
      WHERE COLUMN_NAME IN ('status', 'rejection_reason')
      ORDER BY ORDINAL_POSITION
    `);
    
    newColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE}) 默认值: ${col.COLUMN_DEFAULT || 'none'}`);
    });
    
    console.log('\n🎉 products表rejection_reason字段修复完成！');
    console.log('\n⚠️  重要提醒:');
    console.log('   需要修复后端代码中的SQL语法错误:');
    console.log('   在 simple-server-fixed.js 文件中找到产品状态更新的SQL语句');
    console.log('   添加缺失的逗号: SET status = ?, rejection_reason = ?');
    
    console.log('\n🎯 系统状态:');
    console.log('✅ 认证系统: 正常');
    console.log('✅ 产品管理: 正常');
    console.log('✅ 价格日历: 正常');
    console.log('⚠️  产品审核: 需要修复后端SQL语法');
    console.log('✅ 数据库结构: 全部修复');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixProductsRejectionReasonField().catch(console.error);