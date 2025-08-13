const axios = require('axios');
const jwt = require('jsonwebtoken');

async function quickFix401Auth() {
  console.log('🔧 快速修复401认证问题...\n');
  
  try {
    // 1. 测试登录并获取详细信息
    console.log('=== 1. 测试商家登录 ===');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'testmerchant@test.com',
      password: 'merchant123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('✅ 登录成功');
    console.log('用户ID:', user.id);
    console.log('用户角色:', user.role);
    console.log('用户状态:', user.status);
    
    // 2. 解析token内容
    console.log('\n=== 2. 解析Token ===');
    const decoded = jwt.decode(token);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
    
    // 3. 验证token
    console.log('\n=== 3. 验证Token ===');
    try {
      const verified = jwt.verify(token, 'your-secret-key');
      console.log('✅ Token验证成功');
      console.log('验证结果:', verified);
    } catch (jwtError) {
      console.log('❌ Token验证失败:', jwtError.message);
    }
    
    // 4. 测试API调用
    console.log('\n=== 4. 测试API调用 ===');
    
    // 测试获取商家产品
    try {
      console.log('测试: GET /api/products/merchant/my-products');
      const response = await axios.get('http://localhost:3001/api/products/merchant/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API调用成功');
      console.log('响应状态:', response.status);
      console.log('产品数量:', response.data.data?.products?.length || 0);
      
    } catch (apiError) {
      console.log('❌ API调用失败');
      console.log('状态码:', apiError.response?.status);
      console.log('错误消息:', apiError.response?.data?.message);
      console.log('完整错误:', apiError.response?.data);
      
      // 如果是401错误，提供解决方案
      if (apiError.response?.status === 401) {
        console.log('\n🔧 401错误解决方案:');
        console.log('1. 检查JWT_SECRET环境变量');
        console.log('2. 确认token格式正确');
        console.log('3. 验证用户状态和角色');
        console.log('4. 检查认证中间件逻辑');
      }
    }
    
    // 5. 创建新的有效token（如果需要）
    console.log('\n=== 5. 创建新Token ===');
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        email: user.email
      },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('新Token创建成功');
    console.log('新Token前20位:', newToken.substring(0, 20) + '...');
    
    // 用新token测试API
    try {
      console.log('\n测试新Token...');
      const newResponse = await axios.get('http://localhost:3001/api/products/merchant/my-products', {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 新Token测试成功!');
      console.log('建议: 清除浏览器localStorage并重新登录');
      
    } catch (newError) {
      console.log('❌ 新Token也失败:', newError.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ 修复过程出错:', error.message);
  }
}

quickFix401Auth();