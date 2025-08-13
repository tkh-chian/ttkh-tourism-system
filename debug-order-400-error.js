const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lhjr@170103',
  database: 'ttkh_tourism'
};

async function debugOrder400Error() {
  console.log('🔧 调试订单创建400错误...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查后端服务器日志
    console.log('\n1️⃣ 检查后端订单创建API...');
    
    // 读取后端服务器代码
    const serverFilePath = path.join(__dirname, 'backend', 'simple-server-fixed.js');
    let serverCode;
    
    try {
      serverCode = await fs.readFile(serverFilePath, 'utf8');
      console.log('✅ 成功读取后端服务器代码');
    } catch (error) {
      console.error(`❌ 读取服务器代码失败: ${error.message}`);
      return;
    }
    
    // 查找订单创建API
    const orderApiMatch = serverCode.match(/app\.post\(['"]\/api\/orders['"][^}]*\{([\s\S]*?)\}\);/);
    
    if (orderApiMatch) {
      console.log('✅ 找到订单创建API');
      
      // 检查API中的验证逻辑
      const apiCode = orderApiMatch[1];
      console.log('\n订单API代码片段:');
      console.log(apiCode.substring(0, 500) + '...');
      
      // 检查是否有详细的错误处理
      if (!apiCode.includes('console.error') && !apiCode.includes('console.log')) {
        console.log('⚠️ API缺少详细的错误日志');
        
        // 添加详细的错误日志
        const enhancedApiCode = serverCode.replace(
          /app\.post\(['"]\/api\/orders['"], async \(req, res\) => \{/,
          `app.post('/api/orders', async (req, res) => {
  console.log('📥 收到订单创建请求:', JSON.stringify(req.body, null, 2));`
        );
        
        // 添加错误捕获
        const finalApiCode = enhancedApiCode.replace(
          /} catch \(error\) \{[\s\S]*?res\.status\(500\)\.json\(\{[\s\S]*?\}\);[\s\S]*?\}/,
          `} catch (error) {
    console.error('❌ 订单创建错误详情:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.stack 
    });
  }`
        );
        
        await fs.writeFile(serverFilePath, finalApiCode);
        console.log('✅ 已添加详细的错误日志');
      }
    } else {
      console.log('❌ 未找到订单创建API');
    }
    
    // 2. 测试订单创建API
    console.log('\n2️⃣ 测试订单创建API...');
    
    // 获取一个有效的产品ID和价格日历
    const [products] = await connection.execute(`
      SELECT id, name FROM products WHERE status = 'approved' LIMIT 1
    `);
    
    if (products.length === 0) {
      console.log('❌ 没有找到已批准的产品');
      return;
    }
    
    const productId = products[0].id;
    console.log(`使用产品ID: ${productId} (${products[0].name})`);
    
    // 获取该产品的价格日历
    const [schedules] = await connection.execute(`
      SELECT 
        travel_date,
        DATE_FORMAT(travel_date, '%Y-%m-%d') as formatted_date,
        price,
        available_stock
      FROM price_schedules 
      WHERE product_id = ? AND available_stock > 0
      LIMIT 1
    `, [productId]);
    
    if (schedules.length === 0) {
      console.log('❌ 没有找到可用的价格日历');
      return;
    }
    
    const schedule = schedules[0];
    console.log(`使用日期: ${schedule.formatted_date}, 价格: ${schedule.price}, 库存: ${schedule.available_stock}`);
    
    // 3. 发送测试订单
    const testOrderData = {
      product_id: productId,
      travel_date: schedule.formatted_date,
      adults: 2,
      children_no_bed: 1,
      children_with_bed: 0,
      infants: 0,
      customer_name: '调试测试客户',
      customer_phone: '1234567890',
      customer_email: 'debug-400@test.com',
      notes: '调试400错误测试订单'
    };
    
    console.log('\n3️⃣ 发送测试订单...');
    console.log('订单数据:', JSON.stringify(testOrderData, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/orders`, testOrderData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // 不要抛出400错误，我们要看响应内容
        }
      });
      
      console.log(`\n📥 API响应 (状态码: ${response.status}):`);
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.status === 400) {
        console.log('\n🔍 分析400错误原因:');
        
        // 检查常见的400错误原因
        const errorMessage = response.data.message || '';
        
        if (errorMessage.includes('该日期暂未开放预订')) {
          console.log('❌ 错误原因: 日期查询失败');
          console.log('建议: 检查价格日历查询逻辑');
          
          // 测试日期查询
          console.log('\n测试日期查询...');
          const [dateQuery] = await connection.execute(`
            SELECT * FROM price_schedules 
            WHERE product_id = ? AND DATE_FORMAT(travel_date, '%Y-%m-%d') = ?
          `, [productId, schedule.formatted_date]);
          
          console.log(`日期查询结果: ${dateQuery.length} 条记录`);
          
          if (dateQuery.length === 0) {
            console.log('❌ 日期查询失败，需要修复查询逻辑');
          }
        } else if (errorMessage.includes('库存不足')) {
          console.log('❌ 错误原因: 库存不足');
          console.log('建议: 检查库存计算逻辑');
        } else if (errorMessage.includes('参数')) {
          console.log('❌ 错误原因: 参数验证失败');
          console.log('建议: 检查必填字段验证');
        } else {
          console.log(`❌ 未知错误原因: ${errorMessage}`);
        }
      } else if (response.status === 200) {
        console.log('✅ 订单创建成功！');
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ 后端服务器未运行或端口错误');
      }
    }
    
    // 4. 检查数据库约束
    console.log('\n4️⃣ 检查数据库约束...');
    
    // 检查orders表结构
    const [ordersColumns] = await connection.execute(`
      SHOW COLUMNS FROM orders
    `);
    
    console.log('orders表字段:');
    ordersColumns.forEach(col => {
      if (col.Null === 'NO' && !col.Default && col.Field !== 'id') {
        console.log(`  ⚠️ 必填字段: ${col.Field} (${col.Type})`);
      }
    });
    
    // 检查外键约束
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'orders' 
      AND TABLE_SCHEMA = 'ttkh_tourism'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\norders表外键约束:');
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    
    // 5. 修复建议
    console.log('\n5️⃣ 修复建议:');
    console.log('1. 重启后端服务器以应用错误日志增强');
    console.log('2. 检查后端控制台输出的详细错误信息');
    console.log('3. 确保价格日历查询使用DATE_FORMAT函数');
    console.log('4. 验证所有必填字段都有值');
    console.log('5. 检查外键约束是否满足');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试脚本
debugOrder400Error().catch(console.error);