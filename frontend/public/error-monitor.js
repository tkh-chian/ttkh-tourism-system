// 实时错误监控脚本
(function() {
    const errors = [];
    const MAX_ERRORS = 50;
    
    // 捕获所有JavaScript错误
    window.addEventListener('error', function(event) {
        const error = {
            type: 'JavaScript Error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error ? event.error.stack : 'No stack trace',
            timestamp: new Date().toISOString()
        };
        
        errors.unshift(error);
        if (errors.length > MAX_ERRORS) errors.pop();
        
        console.error('🚨 JavaScript Error Captured:', error);
        updateErrorDisplay();
    });
    
    // 捕获Promise rejection错误
    window.addEventListener('unhandledrejection', function(event) {
        const error = {
            type: 'Promise Rejection',
            message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
            stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace',
            timestamp: new Date().toISOString()
        };
        
        errors.unshift(error);
        if (errors.length > MAX_ERRORS) errors.pop();
        
        console.error('🚨 Promise Rejection Captured:', error);
        updateErrorDisplay();
    });
    
    // 捕获网络请求错误
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .then(response => {
                if (!response.ok) {
                    const error = {
                        type: 'Network Error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        timestamp: new Date().toISOString()
                    };
                    
                    errors.unshift(error);
                    if (errors.length > MAX_ERRORS) errors.pop();
                    
                    console.error('🚨 Network Error Captured:', error);
                    updateErrorDisplay();
                }
                return response;
            })
            .catch(err => {
                const error = {
                    type: 'Network Error',
                    message: err.message,
                    url: args[0],
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                };
                
                errors.unshift(error);
                if (errors.length > MAX_ERRORS) errors.pop();
                
                console.error('🚨 Network Error Captured:', error);
                updateErrorDisplay();
                
                throw err;
            });
    };
    
    // 创建错误显示面板
    function createErrorPanel() {
        const panel = document.createElement('div');
        panel.id = 'error-monitor-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 300px;
            background: #1a1a1a;
            color: #fff;
            border: 2px solid #ff4444;
            border-radius: 8px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            display: none;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #444;
        `;
        
        const title = document.createElement('span');
        title.textContent = '🚨 错误监控';
        title.style.fontWeight = 'bold';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            width: 20px;
            height: 20px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => panel.style.display = 'none';
        
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '复制';
        copyBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 8px;
            cursor: pointer;
            margin-right: 5px;
        `;
        copyBtn.onclick = copyErrorsToClipboard;
        
        header.appendChild(title);
        header.appendChild(copyBtn);
        header.appendChild(closeBtn);
        
        const content = document.createElement('div');
        content.id = 'error-content';
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        return panel;
    }
    
    // 更新错误显示
    function updateErrorDisplay() {
        let panel = document.getElementById('error-monitor-panel');
        if (!panel) {
            panel = createErrorPanel();
        }
        
        const content = document.getElementById('error-content');
        if (errors.length > 0) {
            panel.style.display = 'block';
            content.innerHTML = errors.map(error => `
                <div style="margin-bottom: 10px; padding: 5px; background: #2a2a2a; border-radius: 3px;">
                    <div style="color: #ff6b6b; font-weight: bold;">${error.type}</div>
                    <div style="color: #ffd93d; margin: 2px 0;">${error.message}</div>
                    ${error.url ? `<div style="color: #6bcf7f;">URL: ${error.url}</div>` : ''}
                    ${error.filename ? `<div style="color: #74c0fc;">File: ${error.filename}:${error.lineno}:${error.colno}</div>` : ''}
                    <div style="color: #999; font-size: 10px;">${error.timestamp}</div>
                </div>
            `).join('');
        }
    }
    
    // 复制错误到剪贴板
    function copyErrorsToClipboard() {
        const errorText = errors.map(error => {
            let text = `[${error.timestamp}] ${error.type}: ${error.message}`;
            if (error.url) text += `\nURL: ${error.url}`;
            if (error.filename) text += `\nFile: ${error.filename}:${error.lineno}:${error.colno}`;
            if (error.stack) text += `\nStack: ${error.stack}`;
            return text;
        }).join('\n\n---\n\n');
        
        navigator.clipboard.writeText(errorText).then(() => {
            alert('错误信息已复制到剪贴板！请粘贴给AI助手。');
        }).catch(() => {
            // 备用方案
            const textarea = document.createElement('textarea');
            textarea.value = errorText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('错误信息已复制到剪贴板！请粘贴给AI助手。');
        });
    }
    
    // 全局函数，方便在控制台调用
    window.getErrorReport = function() {
        return errors;
    };
    
    window.copyErrors = copyErrorsToClipboard;
    
    window.clearErrors = function() {
        errors.length = 0;
        const panel = document.getElementById('error-monitor-panel');
        if (panel) panel.style.display = 'none';
        console.log('✅ 错误日志已清空');
    };
    
    console.log('🔍 错误监控系统已启动！');
    console.log('📋 使用 copyErrors() 复制错误信息');
    console.log('🗑️ 使用 clearErrors() 清空错误日志');
    console.log('📊 使用 getErrorReport() 查看所有错误');
})();