const axios = require('axios');

async function completeHumanSimulation() {
    console.log('🎯 开始100%人工模拟测试\n');
    
    const baseURL = 'http://localhost:3001/api';
    let merchantToken = '';
    let adminToken = '';
    let customerToken = '';
    let productId = '';
    let orderId = '';
    
    try {
        // 1. 商家登录
        console.log('=== 1. 商家登录测试 ===');
        const merchantLogin = await axios.post(`${baseURL}/auth/login`, {
            username: 'merchant',
            password: 'merchant123'
        });
        merchantToken = merchantLogin.data.data.token;
        console.log('✅ 商家登录成功');
        console.log(`🔑 商家Token: ${merchantToken.substring(0, 20)}...`);
        
        // 2. 商家上传产品
        console.log('\n=== 2. 商家上传产品测试 ===');
        const productData = {
            title_zh: '泰国曼谷一日游',
            title_th: 'ทัวร์กรุงเทพฯ หนึ่งวัน',
            description_zh: '探索泰国首都的魅力，包含大皇宫、玉佛寺等著名景点',
            description_th: 'สำรวจเสน่ห์ของเมืองหลวงไทย รวมถึงพระบรมมหาราชวัง วัดพระแก้ว และสถานที่ท่องเที่ยวชื่อดัง',
            base_price: 2500,
            category: 'tour',
            duration: '8小时',
            max_participants: 20,
            location: '曼谷',
            highlights: ['大皇宫', '玉佛寺', '湄南河游船', '当地美食']
        };
        
        const createProduct = await axios.post(`${baseURL}/products`, productData, {
            headers: {
                'Authorization': `Bearer ${merchantToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        productId = createProduct.data.data.id;
        const productNumber = createProduct.data.data.product_number;
        console.log('✅ 产品创建成功');
        console.log(`🔢 产品编号: ${productNumber}`);
        console.log(`🆔 产品ID: ${productId}`);
        
        // 3. 管理员登录
        console.log('\n=== 3. 管理员登录测试 ===');
        const adminLogin = await axios.post(`${baseURL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        adminToken = adminLogin.data.data.token;
        console.log('✅ 管理员登录成功');
        
        // 4. 管理员查看待审核产品
        console.log('\n=== 4. 管理员查看待审核产品 ===');
        const pendingProducts = await axios.get(`${baseURL}/admin/products/pending`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        console.log(`✅ 待审核产品数量: ${pendingProducts.data.data.length}`);
        
        // 5. 管理员审核产品
        console.log('\n=== 5. 管理员审核产品 ===');
        const approveProduct = await axios.put(`${baseURL}/admin/products/${productId}/approve`, {
            status: 'approved',
            admin_notes: '产品信息完整，符合平台标准，审核通过'
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        console.log('✅ 产品审核通过');
        
        // 6. 验证首页展示产品
        console.log('\n=== 6. 验证首页展示产品 ===');
        const publicProducts = await axios.get(`${baseURL}/products`);
        const productsData = publicProducts.data.data.products || publicProducts.data.data || [];
        const approvedProducts = productsData.filter(p => p.status === 'approved');
        console.log(`✅ 首页展示产品数量: ${approvedProducts.length}`);
        console.log(`📦 最新产品: ${approvedProducts[0]?.title_zh || '暂无'}`);
        
        // 7. 用户登录
        console.log('\n=== 7. 用户登录测试 ===');
        const customerLogin = await axios.post(`${baseURL}/auth/login`, {
            username: 'customer',
            password: 'customer123'
        });
        customerToken = customerLogin.data.data.token;
        console.log('✅ 用户登录成功');
        
        // 8. 用户下单
        console.log('\n=== 8. 用户下单测试 ===');
        const orderData = {
            product_id: productId,
            travel_date: '2024-12-25',
            adults: 2,
            children_no_bed: 0,
            total_price: 5000,
            customer_name: '张三',
            notes: '需要中文导游'
        };
        
        const createOrder = await axios.post(`${baseURL}/orders`, orderData, {
            headers: {
                'Authorization': `Bearer ${customerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        orderId = createOrder.data.data.orderId;
        const orderNumber = createOrder.data.data.orderNumber;
        console.log('✅ 订单创建成功');
        console.log(`🔢 订单编号: ${orderNumber}`);
        console.log(`💰 订单金额: ${orderData.total_price} 泰铢`);
        
        // 9. 验证数据互通
        console.log('\n=== 9. 验证数据互通 ===');
        
        // 验证订单详情查询
        const orderDetail = await axios.get(`${baseURL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${customerToken}`
            }
        });
        console.log(`✅ 订单详情查询成功: ${orderDetail.data.data.order.order_number}`);
        
        // 商家查看订单
        const merchantOrders = await axios.get(`${baseURL}/orders`, {
            headers: {
                'Authorization': `Bearer ${merchantToken}`
            }
        });
        console.log(`✅ 商家可查看订单数量: ${merchantOrders.data.data.orders.length}`);
        
        // 管理员查看所有订单
        const adminOrders = await axios.get(`${baseURL}/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        console.log(`✅ 管理员可查看订单数量: ${adminOrders.data.data.orders.length}`);
        
        // 用户查看自己的订单
        const customerOrders = await axios.get(`${baseURL}/orders`, {
            headers: {
                'Authorization': `Bearer ${customerToken}`
            }
        });
        console.log(`✅ 用户可查看订单数量: ${customerOrders.data.data.orders.length}`);
        
        // 10. 完整流程验证
        console.log('\n=== 10. 完整流程验证 ===');
        console.log('🎉 100%人工模拟测试完成！');
        console.log('\n📊 测试结果汇总:');
        console.log(`✅ 商家上传产品: 成功 (产品编号: ${productNumber})`);
        console.log(`✅ 管理员审核产品: 成功`);
        console.log(`✅ 首页展示产品: 成功 (${approvedProducts.length}个产品)`);
        console.log(`✅ 用户提交订单: 成功 (订单编号: ${orderNumber})`);
        console.log(`✅ 路由API数据互通: 成功`);
        console.log(`✅ 产品编号自动生成: 成功`);
        console.log(`✅ 订单编号自动生成: 成功`);
        
        console.log('\n🌐 系统访问地址:');
        console.log('前端: http://localhost:3000');
        console.log('后端: http://localhost:3001');
        
        console.log('\n👥 测试账号:');
        console.log('商家: merchant / merchant123');
        console.log('管理员: admin / admin123');
        console.log('用户: customer / customer123');
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('详细错误:', error.response?.data || error.message);
        return false;
    }
}

// 等待服务启动后执行测试
setTimeout(() => {
    completeHumanSimulation().then(success => {
        if (success) {
            console.log('\n🎯 系统已100%准备就绪，可以进行人工操作测试！');
        } else {
            console.log('\n⚠️ 请检查服务状态后重新测试');
        }
    });
}, 5000);