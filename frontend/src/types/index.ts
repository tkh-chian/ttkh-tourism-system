// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'merchant' | 'agent' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  company_name?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
}

 // 产品相关类型
 export interface Product {
   id: string;
   merchant_id: string;
   title_zh: string;
   title_th: string;
   description_zh?: string;
   description_th?: string;
   base_price: number;
   poster_image?: string;
   poster_filename?: string;
   pdf_file?: string;
   pdf_filename?: string;
   status: 'draft' | 'pending' | 'approved' | 'rejected';
   view_count: number;
   order_count: number;
   // DB/后端可能使用 snake_case 或 camelCase，均兼容
   created_at?: string;
   updated_at?: string;
   createdAt?: string;
   updatedAt?: string;
   // 产品编号兼容不同字段名
   product_number?: string;
   productNumber?: string;
   merchant?: User;
   schedules?: PriceSchedule[];
 }

// 价格日程类型
export interface PriceSchedule {
  id: string;
  product_id: string;
  travel_date: string;
  price: number;
  available_stock: number;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

// 订单相关类型
export interface Order {
  id: string;
  order_number?: string; // 订单编号
  order_no?: string; // 订单编号（数据库字段）
  product_id: string;
  customer_id?: string;
  user_id?: string; // 用户ID（数据库字段）
  merchant_id: string;
  agent_id?: string;
  travel_date: string;
  quantity: number;
  total_people?: number; // 总人数（数据库字段）
  adults?: number; // 成人数
  children_no_bed?: number; // 不占床儿童数
  children_with_bed?: number; // 占床儿童数
  infants?: number; // 婴儿数
  unit_price: number;
  total_amount: number;
  total_price?: number; // 总价格（数据库字段）
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  special_requirements?: string;
  notes?: string; // 备注（数据库字段）
  status: 'pending' | 'confirmed' | 'rejected' | 'archived' | 'returned' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_screenshot?: string;
  return_file?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  product_title?: string; // 产品标题
  customer?: User;
  customer_username?: string; // 客户用户名
  merchant?: User;
  merchant_name?: string; // 商家名称
  agent?: User;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页类型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 登录凭据类型
export interface LoginCredentials {
  username: string;
  password: string;
}

// 注册数据类型
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'merchant' | 'agent';
  company_name?: string;
  contact_person?: string;
}

// 文件上传结果类型
export interface FileUploadResult {
  data: string; // base64
  filename: string;
  size: number;
  type: string;
}

// 产品创建数据类型
export interface CreateProductData {
  title_zh: string;
  title_th: string;
  description_zh?: string;
  description_th?: string;
  base_price: number;
  poster_image?: string;
  poster_filename?: string;
  pdf_file?: string;
  pdf_filename?: string;
}

// 订单创建数据类型
export interface CreateOrderData {
  product_id: string;
  travel_date: string;
  quantity: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_requirements?: string;
}

// 语言类型
export type Language = 'zh' | 'th';

// 主题类型
export type Theme = 'light' | 'dark';

// 统计数据类型
export interface Statistics {
  users: {
    customer: number;
    merchant: number;
    agent: number;
    admin: number;
  };
  products: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  orders: {
    [key: string]: {
      count: number;
      total_amount: number;
    };
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
}

// 搜索参数类型
export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 产品搜索参数类型
export interface ProductSearchParams extends SearchParams {
  minPrice?: number;
  maxPrice?: number;
  merchant_id?: string;
}

// 订单搜索参数类型
export interface OrderSearchParams extends SearchParams {
  payment_status?: string;
  customer_id?: string;
  merchant_id?: string;
  agent_id?: string;
}

// 辅助函数：获取库存状态
export const getStockStatus = (availableStock: number): string => {
  if (availableStock === 0) return 'sold-out';
  if (availableStock <= 5) return 'low-stock';
  return 'in-stock';
};

// 辅助函数：获取库存显示
export const getStockDisplay = (stock: number): string => {
  if (stock === 0) return '售罄';
  if (stock > 9) return '>9';
  return stock.toString();
};

// 辅助函数：格式化价格
export const formatPrice = (price: number, currency: string = '¥'): string => {
  return `${currency}${price.toFixed(2)}`;
};

// 辅助函数：格式化日期
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

// 辅助函数：格式化日期时间
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

// 辅助函数：获取用户角色显示名称
export const getRoleDisplayName = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    customer: '客户',
    merchant: '商家',
    agent: '代理',
    admin: '管理员'
  };
  return roleMap[role] || role;
};

// 辅助函数：获取状态显示名称
export const getStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    suspended: '已暂停',
    draft: '草稿',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
    paid: '已支付',
    failed: '支付失败',
    refunded: '已退款'
  };
  return statusMap[status] || status;
};

const TypesModule = {};
export default TypesModule;
