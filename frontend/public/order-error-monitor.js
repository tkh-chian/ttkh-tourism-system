
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
