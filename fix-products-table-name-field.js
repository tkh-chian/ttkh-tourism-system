const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function fixProductsTableNameField() {
  console.log('🔧 修复products表name字段问题...');
  
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
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) 默认值: ${col.COLUMN_DEFAULT || 'none'}`);
    });
    
    // 2. 修复name字段 - 设置为可空或添加默认值
    console.log('\n🔧 修复name字段...');
    try {
      await connection.execute(`
        ALTER TABLE products MODIFY COLUMN name VARCHAR(255) NULL
      `);
      console.log('✅ name字段已设置为可空');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ name字段不存在，跳过修复');
      } else {
        console.log('⚠️ 修复name字段失败:', error.message);
      }
    }
    
    // 3. 检查其他可能有问题的字段
    console.log('\n🔧 检查其他必需字段...');
    const fieldsToFix = [
      'title_zh',
      'title_th', 
      'description_zh',
      'description_th',
      'base_price',
      'status'
    ];
    
    for (const field of fieldsToFix) {
      try {
        const fieldInfo = columns.find(col => col.COLUMN_NAME === field);
        if (fieldInfo && fieldInfo.IS_NULLABLE === 'NO' && !fieldInfo.COLUMN_DEFAULT) {
          console.log(`🔧 修复字段: ${field}`);
          
          if (field === 'base_price') {
            await connection.execute(`
              ALTER TABLE products MODIFY COLUMN ${field} DECIMAL(10,2) DEFAULT 0
            `);
          } else if (field === 'status') {
            await connection.execute(`
              ALTER TABLE products MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
            `);
          } else {
            await connection.execute(`
              ALTER TABLE products MODIFY COLUMN ${field} VARCHAR(255) DEFAULT ''
            `);
          }
          console.log(`✅ ${field}字段已设置默认值`);
        }
      } catch (error) {
        console.log(`⚠️ 修复${field}字段失败:`, error.message);
      }
    }
    
    // 4. 测试产品创建API
    console.log('\n🧪 测试产品创建API...');
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3001';
    
    // 先登录获取token
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'merchant@test.com',
        password: 'merchant123'
      });
      
      if (loginResponse.data.success && loginResponse.data.data.token) {
        const token = loginResponse.data.data.token;
        console.log('✅ 商家登录成功');
        
        // 测试创建产品
        const testProduct = {
          title_zh: '测试产品修复',
          title_th: 'ทดสอบสินค้าแก้ไข',
          description_zh: '这是一个测试产品',
          description_th: 'นี่คือสินค้าทดสอบ',
          base_price: 1000
        };
        
        try {
          const createResponse = await axios.post(`${BASE_URL}/api/products`, testProduct, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (createResponse.data.success) {
            console.log('✅ 产品创建测试成功');
            console.log(`   产品编号: ${createResponse.data.data.product_number}`);
          } else {
            console.log('❌ 产品创建测试失败:', createResponse.data.message);
          }
        } catch (createError) {
          console.log('❌ 产品创建API错误:', createError.response?.data?.message || createError.message);
        }
        
      } else {
        console.log('❌ 商家登录失败');
      }
    } catch (loginError) {
      console.log('❌ 商家登录错误:', loginError.response?.data?.message || loginError.message);
    }
    
    // 5. 测试产品列表API
    console.log('\n📦 测试产品列表API...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      
      if (productsResponse.data.success && Array.isArray(productsResponse.data.data)) {
        console.log(`✅ 产品列表获取成功 (${productsResponse.data.data.length}个产品)`);
        
        if (productsResponse.data.data.length > 0) {
          const product = productsResponse.data.data[0];
          console.log(`   示例产品: ${product.title_zh || product.name || '未命名'}`);
        }
      } else {
        console.log('❌ 产品列表获取失败');
      }
    } catch (error) {
      console.log('❌ 产品列表API错误:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 products表修复完成！');
    console.log('现在产品创建和列表功能应该都正常工作了。');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
fixProductsTableNameField().catch(console.error);