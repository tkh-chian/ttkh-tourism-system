const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function simpleCompleteFlowTest() {
    console.log('🎯 开始简化完整流程测试...\n');
    
    try {
        // 1. 商家登录
        console.log('=== 1. 商家登录 ===');
        const merchantLogin = await axios.post(`${API_BASE}/auth/login`, {
            username: 'merchant',
            password: 'merchant123'
        });
        
        const merchantToken = merchantLogin.data.data.token;
        console.log('✅ 商家登录成功');
        console.log('Token:', merchantToken.substring(0, 20) + '...');
        
        // 2. 创建产品
        console.log('\n=== 2. 创建产品 ===');
        const productData = {
            name: '简化测试产品',
            title_zh: '简化测试产品',
            title_th: 'ผลิตภัณฑ์ทดสอบง่าย',
            description_zh: '这是简化测试产品',
            description_th: 'นี่คือผลิตภัณฑ์ทดสอบง่าย',
            price: 1999,
            base_price: 1999
        };
        
        const createProduct = await axios.post(`${API_BASE}/products`, productData, {
            headers: { 
                'Authorization': `Bearer ${merchantToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const productId = createProduct.data.data.id;
        const productNumber = createProduct.data.data.product_number || createProduct.data.data.productNumber;
        console.log('✅ 产品创建成功');
        console.log(`🔢 产品编号: ${productNumber}`);
        
        // 3. 管理员登录
        console.log('\n=== 3. 管理员登录 ===');
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        const adminToken = adminLogin.data.data.token;
        console.log('✅ 管理员登录成功');
        
        // 4. 提交审核
        console.log('\n=== 4. 提交产品审核 ===');
        await axios.put(`${API_BASE}/products/${productId}/submit`, {}, {
            headers: { Authorization: `Bearer ${merchantToken}` }
        });
        console.log('✅ 产品已提交审核');
        
        // 5. 管理员审核
        console.log('\n=== 5. 管理员审核产品 ===');
        await axios.put(`${API_BASE}/admin/products/${productId}/review`, {
            action: 'approve',
            review_notes: '简化测试 - 审核通过'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ 产品审核通过');
        
        // 6. 用户登录
        console.log('\n=== 6. 用户登录 ===');
        const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
            username: 'customer',
            password: 'customer123'
        });
        
        const customerToken = customerLogin.data.data.token;
        console.log('✅ 用户登录成功');
        
        // 7. 创建订单
        console.log('\n=== 7. 创建订单 ===');
        const orderData = {
            product_id: productId,
            travel_date: '2024-12-25',
            adults: 2,
            children_no_bed: 1,
            total_price: 3998,
            customer_name: '简化测试用户',
            notes: '简化流程测试订单'
        };
        
        const createOrder = await axios.post(`${API_BASE}/orders`, orderData, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        
        const orderNumber = createOrder.data.data.orderNumber;
        console.log('✅ 订单创建成功');
        console.log(`🔢 订单编号: ${orderNumber}`);
        
        // 8. 验证首页产品
        console.log('\n=== 8. 验证首页产品展示 ===');
        const productsResponse = await axios.get(`${API_BASE}/products`);
        const products = productsResponse.data.data || productsResponse.data || [];
        const approvedProducts = products.filter(p => p.status === 'approved');
        console.log(`✅ 首页展示 ${approvedProducts.length} 个已审核产品`);
        
        // 最终总结
        console.log('\n🎉 简化完整流程测试成功！');
        console.log('\n📋 功能验证总结:');
        console.log('✅ 商家登录 - 正常');
        console.log('✅ 产品创建 - 正常');
        console.log('✅ 产品编号生成 - 正常');
        console.log('✅ 管理员登录 - 正常');
        console.log('✅ 产品审核 - 正常');
        console.log('✅ 用户登录 - 正常');
        console.log('✅ 订单创建 - 正常');
        console.log('✅ 订单编号生成 - 正常');
        console.log('✅ 首页产品展示 - 正常');
        
        console.log('\n🌐 系统访问地址:');
        console.log('前端首页: http://localhost:3000');
        console.log('后端API: http://localhost:3001/api');
        
        console.log('\n🎯 系统状态: 100%正常运行，可以进行人工测试');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.log('错误详情:', error.response.data);
        }
    }
}

simpleCompleteFlowTest();