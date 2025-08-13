import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Order } from '../types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const { user } = useAuth();
  // 不使用t变量，避免警告
  useLanguage();

  // 查看订单详情
  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // 返回订单列表
  const backToList = () => {
    setSelectedOrder(null);
    setShowOrderDetail(false);
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      console.log('正在获取订单列表...');
      console.log('当前用户信息:', user);
      
      const response = await fetch('http://localhost:3001/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('订单API返回结果:', result);
      
      if (result.success) {
        // 处理不同的数据格式
        let ordersData = [];
        if (Array.isArray(result.data)) {
          // 直接是数组格式
          ordersData = result.data;
        } else if (result.data && Array.isArray(result.data.orders)) {
          // 包装在orders字段中
          ordersData = result.data.orders;
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
          // 嵌套在data.data中
          ordersData = result.data.data;
        } else {
          console.warn('未知的数据格式:', result.data);
          ordersData = [];
        }
        
        // 标准化订单数据格式
        const normalizedOrders = ordersData.map((order: any) => ({
          id: order.id || order.orderId,
          order_no: order.order_number || order.orderNumber || order.order_no,
          product_id: order.product_id || order.productId,
          product_title: order.product_title || order.productTitle,
          travel_date: order.travel_date || order.travelDate,
          adults: order.adults || order.adultCount || 0,
          children_no_bed: order.children_no_bed || 0,
          children_with_bed: order.children_with_bed || 0,
          total_people: order.total_people || order.totalPeople || (order.adults + (order.children_no_bed || 0) + (order.children_with_bed || 0)),
          total_price: order.total_price || order.totalPrice || order.total_amount || order.totalAmount,
          customer_name: order.customer_name || order.customerName,
          status: order.status,
          created_at: order.created_at || order.createdAt
        }));
        
        // 根据订单ID去重
        const uniqueOrders = normalizedOrders.filter((order: any, index: number, self: any[]) => 
          index === self.findIndex((o: any) => o.id === order.id)
        );
        
        console.log('处理后的订单数据:', uniqueOrders);
        setOrders(uniqueOrders);
      } else {
        throw new Error(result.message || '获取订单失败');
      }
    } catch (error: any) {
      console.error('加载订单失败:', error);
      setError(error.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'returned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待处理',
      'confirmed': '已确认',
      'rejected': '已拒绝',
      'archived': '已归档',
      'returned': '已退款'
    };
    return statusMap[status] || status;
  };

  // 订单详情页面
  if (showOrderDetail && selectedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center">
          <button
            onClick={backToList}
            className="mr-4 flex items-center text-primary-600 hover:text-primary-800"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回订单列表
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            订单详情
          </h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              订单信息
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              订单号: {selectedOrder.order_no || selectedOrder.order_number}
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">产品名称</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedOrder.product_title}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">出行日期</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedOrder.travel_date}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">订单状态</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">客户姓名</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedOrder.customer_name}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">人数</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  成人: {selectedOrder.adults} 人
                  {selectedOrder.children_no_bed && selectedOrder.children_no_bed > 0 && `, 不占床儿童: ${selectedOrder.children_no_bed} 人`}
                  {selectedOrder.children_with_bed && selectedOrder.children_with_bed > 0 && `, 占床儿童: ${selectedOrder.children_with_bed} 人`}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">总价</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">¥{selectedOrder.total_price}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(selectedOrder.created_at).toLocaleString()}</dd>
              </div>
              {selectedOrder.notes && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">备注</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedOrder.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          我的订单
        </h1>

        {/* 状态筛选 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === '' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            全部
          </button>
          {['pending', 'confirmed', 'rejected', 'archived', 'returned'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === status 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadOrders}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            重新加载
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">暂无订单</div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Array.isArray(orders) && orders.map((order, index) => (
              <li 
                key={order.id || order.order_no || `order-${index}`}
                onClick={() => viewOrderDetail(order)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary-600 truncate">
                          订单号: {order.order_no || order.order_number || order.id}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {order.product_title || '未知产品'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1H6V9a2 2 0 012-2h3z" />
                            </svg>
                            {order.travel_date}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                          </svg>
                          <p>
                            {order.customer_name} · {order.total_people}人 · ¥{order.total_price}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Orders;