// 全局错误捕获和上报
class ErrorReporter {
  private static instance: ErrorReporter;
  private debugEndpoint = 'http://localhost:3002/debug/error';

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  init() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        error: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack || '',
        type: 'promise'
      });
    });

    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        error: event.message,
        stack: event.error?.stack || '',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      });
    });

    // 捕获React错误边界
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('React') || message.includes('Warning')) {
        this.reportError({
          error: message,
          stack: new Error().stack || '',
          type: 'react'
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  reportError(errorInfo: any) {
    const errorData = {
      ...errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // 发送到调试服务器
    fetch(this.debugEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // 静默处理发送失败
    });

    // 同时输出到控制台
    console.error('🚨 错误上报:', errorData);
  }

  // 手动上报API错误
  reportApiError(url: string, error: any, response?: any) {
    this.reportError({
      error: `API Error: ${error.message || error}`,
      stack: error.stack || '',
      apiUrl: url,
      response: response ? JSON.stringify(response) : '',
      type: 'api'
    });
  }
}

export default ErrorReporter;

// 确保这是一个模块文件
export {};
