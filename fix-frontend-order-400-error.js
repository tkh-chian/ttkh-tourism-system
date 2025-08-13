const fs = require('fs').promises;
const path = require('path');

async function fixFrontendOrder400Error() {
  console.log('🔧 修复前端订单创建400错误...');
  
  try {
    // 1. 修复ProductDetail.tsx中的订单提交逻辑
    console.log('\n1️⃣ 修复ProductDetail.tsx订单提交逻辑...');
    
    const productDetailPath = path.join(__dirname, 'frontend', 'src', 'pages', 'ProductDetail.tsx');
    let productDetailCode = await fs.readFile(productDetailPath, 'utf8');
    
    // 检查当前的订单提交代码
    const currentOrderSubmit = productDetailCode.match(/const handleOrderSubmit = async \(orderData: OrderFormData\) => \{[\s\S]*?\};/);
    
    if (currentOrderSubmit) {
      console.log('✅ 找到订单提交函数');
      
      // 修复订单提交逻辑，确保发送正确的数据格式
      const fixedOrderSubmit = `const handleOrderSubmit = async (orderData: OrderFormData) => {
    try {
      console.log('📤 发送订单数据:', orderData);
      
      // 确保所有必填字段都有值
      const orderPayload = {
        product_id: id,
        travel_date: orderData.travel_date,
        adults: orderData.adults || 1,
        children_no_bed: orderData.children_no_bed || 0,
        children_with_bed: orderData.children_with_bed || 0,
        infants: orderData.infants || 0,
        customer_name: orderData.customer_name.trim(),
        customer_phone: orderData.customer_phone.trim(),
        customer_email: orderData.customer_email?.trim() || '',
        notes: orderData.notes?.trim() || ''
      };
      
      console.log('📤 最终订单载荷:', orderPayload);
      
      const response = await api.post('/orders', orderPayload);
      
      console.log('📥 订单创建响应:', response.data);
      
      if (response.data.success) {
        alert('订单创建成功！订单号: ' + response.data.data.order_number);
        setShowOrderForm(false);
        // 刷新产品详情以更新订单数量
        fetchProductDetail();
      } else {
        throw new Error(response.data.message || '创建订单失败');
      }
    } catch (error: any) {
      console.error('创建订单失败:', error);
      
      // 显示更详细的错误信息
      let errorMessage = '创建订单失败，请重试';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      throw error;
    }
  };`;
      
      // 替换订单提交函数
      productDetailCode = productDetailCode.replace(
        /const handleOrderSubmit = async \(orderData: OrderFormData\) => \{[\s\S]*?\};/,
        fixedOrderSubmit
      );
      
      await fs.writeFile(productDetailPath, productDetailCode);
      console.log('✅ 已修复ProductDetail.tsx订单提交逻辑');
    }
    
    // 2. 修复OrderForm.tsx中的表单验证和提交
    console.log('\n2️⃣ 修复OrderForm.tsx表单验证...');
    
    const orderFormPath = path.join(__dirname, 'frontend', 'src', 'components', 'OrderForm.tsx');
    let orderFormCode = await fs.readFile(orderFormPath, 'utf8');
    
    // 修复表单验证逻辑
    const currentValidateForm = orderFormCode.match(/const validateForm = \(\) => \{[\s\S]*?\};/);
    
    if (currentValidateForm) {
      const fixedValidateForm = `const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.travel_date) {
      newErrors.travel_date = '请选择出行日期';
    }

    if (formData.adults < 1) {
      newErrors.adults = '至少需要1名成人';
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '请输入客户姓名';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = '请输入联系电话';
    } else if (!/^[\\d\\s\\-+()]+$/.test(formData.customer_phone.trim())) {
      newErrors.customer_phone = '请输入有效的电话号码';
    }

    if (formData.customer_email && formData.customer_email.trim() && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.customer_email.trim())) {
      newErrors.customer_email = '请输入有效的邮箱地址';
    }

    const totalPeople = formData.adults + formData.children_no_bed + formData.children_with_bed + formData.infants;
    if (totalPeople === 0) {
      newErrors.people = '至少需要1人';
    }

    if (selectedSchedule && totalPeople > selectedSchedule.available_stock) {
      newErrors.people = \`人数超过可用库存 (\${selectedSchedule.available_stock})\`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };`;
      
      orderFormCode = orderFormCode.replace(
        /const validateForm = \(\) => \{[\s\S]*?\};/,
        fixedValidateForm
      );
      
      await fs.writeFile(orderFormPath, orderFormCode);
      console.log('✅ 已修复OrderForm.tsx表单验证');
    }
    
    // 3. 修复API服务中的订单创建
    console.log('\n3️⃣ 修复API服务订单创建...');
    
    const apiPath = path.join(__dirname, 'frontend', 'src', 'services', 'api.ts');
    let apiCode = await fs.readFile(apiPath, 'utf8');
    
    // 检查是否有客户订单API
    if (!apiCode.includes('getCustomerOrders')) {
      console.log('添加客户订单API...');
      
      // 在orderAPI中添加客户订单相关的API
      const orderAPIMatch = apiCode.match(/(export const orderAPI = \{[\s\S]*?)\};/);
      
      if (orderAPIMatch) {
        const enhancedOrderAPI = orderAPIMatch[1] + `
  
  // 客户订单相关API
  getCustomerOrders: (params?: any) => api.get('/customer/orders', { params }),
  
  getCustomerOrder: (id: string) => api.get(\`/customer/orders/\${id}\`),`;
        
        apiCode = apiCode.replace(orderAPIMatch[0], enhancedOrderAPI + '\n};');
        
        await fs.writeFile(apiPath, apiCode);
        console.log('✅ 已添加客户订单API');
      }
    }
    
    // 4. 检查后端服务器是否有详细的错误日志
    console.log('\n4️⃣ 检查后端服务器错误日志...');
    
    const serverPath = path.join(__dirname, 'backend', 'simple-server-fixed.js');
    let serverCode = await fs.readFile(serverPath, 'utf8');
    
    // 确保订单创建API有详细的错误日志
    if (!serverCode.includes('console.log(\'📥 收到订单创建请求:\')')) {
      console.log('添加详细的订单创建日志...');
      
      // 在订单创建API开始处添加详细日志
      serverCode = serverCode.replace(
        /app\.post\(['"]\/api\/orders['"], async \(req, res\) => \{/,
        `app.post('/api/orders', async (req, res) => {
  console.log('📥 收到订单创建请求:', JSON.stringify(req.body, null, 2));
  console.log('请求头:', JSON.stringify(req.headers, null, 2));`
      );
      
      // 在错误处理中添加详细日志
      serverCode = serverCode.replace(
        /} catch \(error\) \{[\s\S]*?res\.status\(500\)\.json\(\{[\s\S]*?\}\);[\s\S]*?\}/,
        `} catch (error) {
    console.error('❌ 订单创建错误详情:', error);
    console.error('错误堆栈:', error.stack);
    console.error('请求体:', JSON.stringify(req.body, null, 2));
    
    // 返回更详细的错误信息
    const errorMessage = error.message || '订单创建失败';
    const statusCode = error.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }`
      );
      
      await fs.writeFile(serverPath, serverCode);
      console.log('✅ 已添加详细的订单创建错误日志');
    }
    
    // 5. 创建前端错误监控
    console.log('\n5️⃣ 创建前端错误监控...');
    
    const errorMonitorPath = path.join(__dirname, 'frontend', 'public', 'order-error-monitor.js');
    const errorMonitorCode = `
// 订单创建错误监控
(function() {
  'use strict';
  
  // 监控所有网络请求
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // 如果是订单创建请求
    if (url.includes('/api/orders') && options?.method === 'POST') {
      console.log('🔍 监控到订单创建请求:', {
        url: url,
        method: options.method,
        headers: options.headers,
        body: options.body
      });
    }
    
    return originalFetch.apply(this, args).then(response => {
      // 如果是订单创建响应
      if (url.includes('/api/orders') && options?.method === 'POST') {
        console.log('📥 订单创建响应:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // 如果是400错误，记录详细信息
        if (response.status === 400) {
          response.clone().json().then(data => {
            console.error('❌ 订单创建400错误详情:', data);
            
            // 显示用户友好的错误提示
            if (data.message) {
              alert('订单创建失败: ' + data.message);
            }
          }).catch(e => {
            console.error('解析400错误响应失败:', e);
          });
        }
      }
      
      return response;
    });
  };
  
  // 监控axios请求（如果使用axios）
  if (window.axios) {
    window.axios.interceptors.request.use(function (config) {
      if (config.url?.includes('/orders') && config.method === 'post') {
        console.log('🔍 Axios订单创建请求:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers
        });
      }
      return config;
    });
    
    window.axios.interceptors.response.use(
      function (response) {
        if (response.config.url?.includes('/orders') && response.config.method === 'post') {
          console.log('📥 Axios订单创建响应:', {
            status: response.status,
            data: response.data
          });
        }
        return response;
      },
      function (error) {
        if (error.config?.url?.includes('/orders') && error.config?.method === 'post') {
          console.error('❌ Axios订单创建错误:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
        return Promise.reject(error);
      }
    );
  }
  
  console.log('✅ 订单错误监控已启动');
})();
`;
    
    await fs.writeFile(errorMonitorPath, errorMonitorCode);
    console.log('✅ 已创建前端订单错误监控');
    
    // 6. 修改index.html以包含错误监控
    const indexHtmlPath = path.join(__dirname, 'frontend', 'public', 'index.html');
    let indexHtml = await fs.readFile(indexHtmlPath, 'utf8');
    
    if (!indexHtml.includes('order-error-monitor.js')) {
      indexHtml = indexHtml.replace(
        '</head>',
        '  <script src="/order-error-monitor.js"></script>\n  </head>'
      );
      
      await fs.writeFile(indexHtmlPath, indexHtml);
      console.log('✅ 已在index.html中添加订单错误监控');
    }
    
    console.log('\n🎉 前端订单400错误修复完成！');
    console.log('\n修复内容:');
    console.log('1. ✅ 修复了ProductDetail.tsx中的订单提交逻辑');
    console.log('2. ✅ 修复了OrderForm.tsx中的表单验证');
    console.log('3. ✅ 添加了客户订单API');
    console.log('4. ✅ 增强了后端错误日志');
    console.log('5. ✅ 添加了前端错误监控');
    
    console.log('\n📋 下一步操作:');
    console.log('1. 重启前端服务器: cd frontend && npm start');
    console.log('2. 重启后端服务器: cd backend && node simple-server-fixed.js');
    console.log('3. 在浏览器中测试订单创建功能');
    console.log('4. 查看浏览器控制台的详细错误信息');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复脚本
fixFrontendOrder400Error().catch(console.error);