const axios = require('axios');

async function testHomepageProducts() {
  try {
    console.log('=== 测试首页产品显示修复 ===\n');
    
    // 1. 测试产品API
    console.log('1. 测试产品API...');
    const response = await axios.get('http://localhost:3001/api/products');
    console.log('API状态:', response.status);
    console.log('数据结构:', {
      success: response.data.success,
      dataType: typeof response.data.data,
      isArray: Array.isArray(response.data.data),
      count: response.data.data ? response.data.data.length : 0
    });
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('第一个产品:', {
        id: response.data.data[0].id,
        title: response.data.data[0].title_zh,
        price: response.data.data[0].base_price,
        status: response.data.data[0].status
      });
    }
    
    // 2. 检查已批准的产品
    console.log('\n2. 检查已批准的产品...');
    const approvedResponse = await axios.get('http://localhost:3001/api/products?status=approved');
    console.log('已批准产品数量:', approvedResponse.data.data ? approvedResponse.data.data.length : 0);
    
    if (approvedResponse.data.data && approvedResponse.data.data.length === 0) {
      console.log('\n没有已批准的产品，检查所有产品状态...');
      if (response.data.data) {
        const statusCount = {};
        response.data.data.forEach(p => {
          statusCount[p.status] = (statusCount[p.status] || 0) + 1;
        });
        console.log('产品状态统计:', statusCount);
        
        // 3. 如果没有已批准的产品，创建并批准一个
        if (!statusCount.approved) {
          console.log('\n3. 创建并批准测试产品...');
          await createAndApproveTestProduct();
        }
      }
    } else {
      console.log('✅ 首页应该能正常显示产品了');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

async function createAndApproveTestProduct() {
  try {
    // 1. 商家登录
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'merchant',
      password: 'merchant123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 商家登录失败');
      return;
    }
    
    const merchantToken = loginResponse.data.data.token;
    console.log('✅ 商家登录成功');
    
    // 2. 创建测试产品
    const productData = {
      title_zh: '泰国曼谷三日游',
      title_th: 'ทัวร์กรุงเทพ 3 วัน',
      description_zh: '探索泰国首都的魅力，包含大皇宫、卧佛寺等著名景点',
      description_th: 'สำรวจเสน่ห์ของเมืองหลวงไทย รวมถึงพระบรมมหาราชวัง วัดโพธิ์ และสถานที่ท่องเที่ยวชื่อดัง',
      base_price: 2999
    };
    
    const createResponse = await axios.post('http://localhost:3001/api/products', productData, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    
    if (createResponse.data.success) {
      const productId = createResponse.data.data.id;
      console.log('✅ 产品创建成功，ID:', productId);
      
      // 3. 管理员登录
      const adminLoginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      if (adminLoginResponse.data.success) {
        const adminToken = adminLoginResponse.data.data.token;
        console.log('✅ 管理员登录成功');
        
        // 4. 批准产品
        const approveResponse = await axios.put(`http://localhost:3001/api/admin/products/${productId}/approve`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (approveResponse.data.success) {
          console.log('✅ 产品批准成功');
          
          // 5. 验证首页能否显示产品
          const homepageResponse = await axios.get('http://localhost:3001/api/products?status=approved');
          console.log('✅ 首页产品数量:', homepageResponse.data.data.length);
          console.log('✅ 首页修复完成！');
        } else {
          console.log('❌ 产品批准失败:', approveResponse.data.message);
        }
      } else {
        console.log('❌ 管理员登录失败');
      }
    } else {
      console.log('❌ 产品创建失败:', createResponse.data.message);
    }
  } catch (error) {
    console.error('❌ 创建产品错误:', error.message);
  }
}

testHomepageProducts();