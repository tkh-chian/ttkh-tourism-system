const mysql = require('mysql2/promise');
const axios = require('axios');

async function testHomepageComplete() {
  console.log('🧪 完整测试首页产品显示功能...\n');
  
  let connection;
  
  try {
    // 1. 连接数据库
    console.log('1. 连接数据库...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lhjr@170103',
      database: 'ttkh_tourism'
    });
    console.log('✅ 数据库连接成功');
    
    // 2. 检查并创建测试产品
    console.log('\n2. 检查产品数据...');
    const [approved] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE status = "approved"');
    console.log(`已审核通过的产品数量: ${approved[0].count}`);
    
    // 3. 验证数据库中的产品
    console.log('\n3. 验证数据库产品...');
    const [products] = await connection.execute('SELECT id, title_zh, title_th, status, base_price FROM products WHERE status = "approved"');
    console.log(`找到 ${products.length} 个已审核产品:`);
    products.forEach((p, i) => {
      const title = p.title_zh || p.title_th || '无标题';
      console.log(`  ${i+1}. ${title} (ID: ${p.id}, 价格: ¥${p.base_price})`);
    });
    
    // 4. 测试API响应
    console.log('\n4. 测试产品API...');
    try {
      const response = await axios.get('http://localhost:3001/api/products?status=approved', {
        timeout: 5000
      });
      
      console.log(`API响应状态: ${response.status}`);
      console.log(`API返回产品数量: ${response.data.length || 0}`);
      
      if (response.data.length > 0) {
        console.log('API返回的产品:');
        response.data.forEach((p, i) => {
          const title = p.title_zh || p.title_th || p.name || '无标题';
          console.log(`  ${i+1}. ${title} (状态: ${p.status}, 价格: ¥${p.base_price})`);
        });
        console.log('✅ API测试成功');
      } else {
        console.log('❌ API没有返回产品数据');
      }
      
    } catch (apiError) {
      console.error('❌ API测试失败:', apiError.message);
      if (apiError.code === 'ECONNREFUSED') {
        console.log('💡 提示: 请确保后端服务器正在运行 (npm run dev)');
      }
    }
    
    // 5. 检查前端Home组件的API调用逻辑
    console.log('\n5. 检查前端API调用逻辑...');
    const fs = require('fs');
    const homeComponentPath = 'frontend/src/pages/Home.tsx';
    
    if (fs.existsSync(homeComponentPath)) {
      const homeContent = fs.readFileSync(homeComponentPath, 'utf8');
      
      // 检查API调用
      const hasApiCall = homeContent.includes("fetch('http://localhost:3001/api/products?status=approved')");
      console.log(`API调用检查: ${hasApiCall ? '✅ 正确' : '❌ 错误'}`);
      
      // 检查状态管理
      const hasProductsState = homeContent.includes('const [products, setProducts] = useState');
      console.log(`产品状态管理: ${hasProductsState ? '✅ 正确' : '❌ 错误'}`);
      
      // 检查产品渲染
      const hasProductRender = homeContent.includes('filteredProducts.map');
      console.log(`产品渲染逻辑: ${hasProductRender ? '✅ 正确' : '❌ 错误'}`);
      
      if (hasApiCall && hasProductsState && hasProductRender) {
        console.log('✅ 前端代码逻辑正确');
      } else {
        console.log('❌ 前端代码存在问题');
      }
    } else {
      console.log('❌ 找不到Home组件文件');
    }
    
    // 6. 总结测试结果
    console.log('\n📊 测试总结:');
    console.log('='.repeat(50));
    console.log(`数据库产品数量: ${products.length}`);
    console.log('前端组件状态: 已检查');
    console.log('API接口状态: 已测试');
    
    if (products.length > 0) {
      console.log('\n✅ 首页应该能正常显示产品卡片');
      console.log('💡 如果首页仍然没有显示产品，请检查:');
      console.log('   1. 前端服务器是否正在运行');
      console.log('   2. 后端服务器是否正在运行');
      console.log('   3. 浏览器控制台是否有错误信息');
      console.log('   4. 网络请求是否成功');
    } else {
      console.log('\n❌ 数据库中没有已审核的产品');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testHomepageComplete().catch(console.error);