
// API配置 - 自动适应环境
const API_CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:3001/api',
    timeout: 10000
  },
  // 生产环境 - 使用相对路径，通过Netlify重定向到Railway
  production: {
    baseURL: '/api',
    timeout: 30000
  }
};

const currentConfig = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;

export default currentConfig;
