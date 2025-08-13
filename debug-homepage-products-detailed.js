const axios = require('axios');

async function debugHomepageProducts() {
  console.log('🔍 详细调试首页产品展示功能...\n');

  try {
    // 1. 检查产品API返回的原始数据
    console.log('1️⃣ 检查产品API原始数据...');
    const productsResponse = await axios.get('http://localhost:3001/api/products');
    console.log(`✅ API状态: ${productsResponse.status}`);
    console.log(`📦 原始响应数据:`, JSON.stringify(productsResponse.data, null, 2));
    
    // 2. 检查数据结构
    console.log('\n2️⃣ 分析数据结构...');
    const responseData = productsResponse.data;
    
    if (responseData && typeof responseData === 'object') {
      console.log(`📋 响应类型: ${typeof responseData}`);
      console.log(`📋 是否为数组: ${Array.isArray(responseData)}`);
      console.log(`📋 响应键: ${Object.keys(responseData)}`);
      
      if (responseData.success !== undefined) {
        console.log(`✅ success字段: ${responseData.success}`);
        console.log(`📦 data字段类型: ${typeof responseData.data}`);
        console.log(`📦 data是否为数组: ${Array.isArray(responseData.data)}`);
        
        if (Array.isArray(responseData.data)) {
          console.log(`📦 产品数量: ${responseData.data.length}`);
          
          if (responseData.data.length > 0) {
            console.log(`📋 第一个产品:`, JSON.stringify(responseData.data[0], null, 2));
          }
        }
      } else if (Array.isArray(responseData)) {
        console.log(`📦 直接数组，产品数量: ${responseData.length}`);
        if (responseData.length > 0) {
          console.log(`📋 第一个产品:`, JSON.stringify(responseData[0], null, 2));
        }
      }
    }

    // 3. 测试前端获取逻辑
    console.log('\n3️⃣ 模拟前端获取逻辑...');
    try {
      const frontendResponse = await axios.get('http://localhost:3001/api/products?status=approved');
      console.log(`✅ 前端API调用状态: ${frontendResponse.status}`);
      console.log(`📦 前端API响应:`, JSON.stringify(frontendResponse.data, null, 2));
    } catch (error) {
      console.log(`❌ 前端API调用失败: ${error.message}`);
    }

    // 4. 检查产品状态
    console.log('\n4️⃣ 检查产品状态...');
    const allProducts = Array.isArray(responseData) ? responseData : 
                       (responseData.data && Array.isArray(responseData.data) ? responseData.data : []);
    
    if (allProducts.length > 0) {
      const statusCounts = {};
      allProducts.forEach(product => {
        const status = product.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log(`📊 产品状态统计:`, statusCounts);
      
      const approvedProducts = allProducts.filter(p => p.status === 'approved');
      console.log(`✅ 已批准产品数量: ${approvedProducts.length}`);
      
      if (approvedProducts.length > 0) {
        console.log(`📋 第一个已批准产品:`, JSON.stringify(approvedProducts[0], null, 2));
      }
    }

    // 5. 检查前端首页内容
    console.log('\n5️⃣ 检查前端首页内容...');
    try {
      const homepageResponse = await axios.get('http://localhost:3000');
      const content = homepageResponse.data;
      
      console.log(`✅ 首页状态: ${homepageResponse.status}`);
      console.log(`📄 内容长度: ${content.length}`);
      
      // 检查关键内容
      const hasReactRoot = content.includes('id="root"');
      const hasReactScript = content.includes('react') || content.includes('React');
      const hasProductText = content.includes('产品') || content.includes('Product');
      
      console.log(`⚛️ 包含React根元素: ${hasReactRoot}`);
      console.log(`⚛️ 包含React相关: ${hasReactScript}`);
      console.log(`📦 包含产品相关文本: ${hasProductText}`);
      
    } catch (error) {
      console.log(`❌ 首页访问失败: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// 运行调试
debugHomepageProducts();