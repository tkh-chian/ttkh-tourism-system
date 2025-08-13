import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',  // 直接指向后端端口
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 移除401处理避免死循环
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 移除401自动跳转，避免死循环
    console.error('API请求错误:', error.message);
    return Promise.reject(error);
  }
);

// API接口定义
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', { email: credentials.email, password: credentials.password }),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    company_name?: string;
    contact_person?: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const productAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  createProduct: (data: any) => api.post('/products', data),
  
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  
  getProductSchedules: (id: string, params?: any) =>
    api.get(`/products/${id}/schedules`, { params }),
  
  setProductSchedule: (id: string, data: any) =>
    api.post(`/products/${id}/schedules`, data),
  
  updateProductSchedule: (id: string, date: string, data: any) =>
    api.put(`/products/${id}/schedules/${date}`, data),
  
  deleteProductSchedule: (id: string, date: string) =>
    api.delete(`/products/${id}/schedules/${date}`),
};

export const orderAPI = {
  getOrders: (params?: any) => api.get('/orders', { params }),
  
  getOrder: (id: string) => api.get(`/orders/${id}`),
  
  createOrder: (data: any) => api.post('/orders', data),
  
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  
  uploadPaymentScreenshot: (id: string, data: any) =>
    api.post(`/orders/${id}/payment`, data),
  
  uploadReturnFile: (id: string, data: any) =>
    api.post(`/orders/${id}/return-file`, data),

  
  // 客户订单相关API
  getCustomerOrders: (params?: any) => api.get('/customer/orders', { params }),
  
  getCustomerOrder: (id: string) => api.get(`/customer/orders/${id}`),
};

export const adminAPI = {
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  
  updateUserStatus: (id: string, status: string) =>
    api.put(`/admin/users/${id}/status`, { status }),
  
  getProducts: (params?: any) => api.get('/admin/products', { params }),
  
  approveProduct: (id: string) => api.put(`/admin/products/${id}/approve`),
  
  rejectProduct: (id: string, reason: string) =>
    api.put(`/admin/products/${id}/reject`, { reason }),
  
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  
  getStatistics: () => api.get('/admin/statistics'),
};

export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadPDF: (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/upload/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
export { api };