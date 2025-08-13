// IE错误监控脚本 - 自动捕获并上报错误
(function() {
    console.log('🔍 IE错误监控已启动');
    
    // 错误计数器
    let errorCount = 0;
    
    // 发送错误到监控服务器
    function sendError(errorData) {
        try {
            errorCount++;
            console.log('🚨 捕获到错误 #' + errorCount + ':', errorData.message);
            
            // 使用XMLHttpRequest确保IE兼容性
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3001/browser-error', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log('✅ 错误已上报到监控系统');
                    } else {
                        console.log('❌ 错误上报失败');
                    }
                }
            };
            
            xhr.send(JSON.stringify(errorData));
        } catch (e) {
            console.log('❌ 发送错误失败:', e);
        }
    }
    
    // 全局错误处理
    window.onerror = function(message, source, lineno, colno, error) {
        var errorData = {
            type: 'JavaScript Error',
            message: message || 'Unknown error',
            source: source || 'Unknown source',
            lineno: lineno || 0,
            colno: colno || 0,
            stack: error && error.stack ? error.stack : 'No stack trace',
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        sendError(errorData);
        return false; // 不阻止默认错误处理
    };
    
    // Promise错误处理
    if (window.addEventListener) {
        window.addEventListener('unhandledrejection', function(event) {
            var errorData = {
                type: 'Promise Rejection',
                message: event.reason ? event.reason.toString() : 'Promise rejected',
                source: 'Promise',
                lineno: 0,
                colno: 0,
                stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace',
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
            
            sendError(errorData);
        });
    }
    
    // 资源加载错误
    if (window.addEventListener) {
        window.addEventListener('error', function(event) {
            if (event.target !== window) {
                var errorData = {
                    type: 'Resource Error',
                    message: 'Failed to load: ' + (event.target.src || event.target.href || 'Unknown resource'),
                    source: event.target.src || event.target.href || 'Unknown',
                    lineno: 0,
                    colno: 0,
                    stack: 'Resource loading error',
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };
                
                sendError(errorData);
            }
        }, true);
    }
    
    // 定期发送心跳，确认监控正常
    setInterval(function() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3001/browser-error', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.send(JSON.stringify({
                type: 'Heartbeat',
                message: 'IE错误监控正常运行 - 已捕获 ' + errorCount + ' 个错误',
                source: 'Monitor',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }));
        } catch (e) {
            // 静默处理心跳错误
        }
    }, 60000); // 每分钟发送一次心跳
    
    console.log('✅ IE错误监控初始化完成');
})();