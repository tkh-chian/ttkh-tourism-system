// 自动生成的API配置
const config = {
  development: {
    API_URL: 'http://localhost:3001/api'
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || 'https://ttkh-tourism-backend.onrender.com/api'
  }
};

const currentConfig = config[process.env.NODE_ENV] || config.development;

export default currentConfig;
