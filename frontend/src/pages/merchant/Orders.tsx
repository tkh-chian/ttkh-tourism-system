import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// 只导入 message 组件
import { message } from 'antd';

// 扩展ButtonProps以包含children属性
interface CustomButtonProps {
  children?: ReactNode;
  onClick?: () => void;
}

// 订单状态类型
type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';

// 订单数据接口
interface OrderItem {
  orderId: number;
  orderNumber: string;
  productId: number;
  productTitle: string;
  travelDate: string;
  adultCount: number;
  childCount: number;
  totalAmount: number;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
}

// 订单详情接口
interface OrderDetail {
  id: number;
  order_number: string;
  customer_id: string;
  product_id: number;
  travel_date: string;
  adults: number;
  children_no_bed: number;
  total_price: number;
  customer_name: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: number;
    name: string;
    title_zh: string;
    merchant_id: string;
  };
  customer?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
  };
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { id: orderId } = useParams();
  const currentLanguage = 'zh'; // 默认使用中文
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 状态标签配置
  const statusConfig: Record<OrderStatus, { text: string; color: string }> = {
    pending: { text: currentLanguage === 'zh' ? '待付款' : 'Pending Payment', color: '#fa8c16' },
    paid: { text: currentLanguage === 'zh' ? '已付款' : 'Paid', color: '#1890ff' },
    confirmed: { text: currentLanguage === 'zh' ? '已确认' : 'Confirmed', color: '#722ed1' },
    completed: { text: currentLanguage === 'zh' ? '已完成' : 'Completed', color: '#52c41a' },
    cancelled: { text: currentLanguage === 'zh' ? '已取消' : 'Cancelled', color: '#f5222d' },
    refunding: { text: currentLanguage === 'zh' ? '退款中' : 'Refunding', color: '#faad14' },
    refunded: { text: currentLanguage === 'zh' ? '已退款' : 'Refunded', color: '#8c8c8c' }
  };

  // 获取订单详情
  const fetchOrderDetail = useCallback(async (id: string) => {
    try {
      setLoading(true);
      console.log('正在获取订单详情，ID:', id);
      const response = await axios.get(`http://localhost:3001/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('订单详情API返回:', response.data);

      if (response.data.success) {
        // 确保数据格式一致
        const orderData = response.data.data.order;
        setCurrentOrder({
          ...orderData,
          // 确保字段名称一致
          order_number: orderData.order_number || orderData.orderNumber,
          status: orderData.status || 'pending'
        });
      } else {
        message.error(response.data.message || (currentLanguage === 'zh' ? '获取订单详情失败' : 'Failed to get order details'));
      }
    } catch (error) {
      console.error('获取订单详情错误:', error);
      message.error(currentLanguage === 'zh' ? '网络错误，获取订单详情失败' : 'Network error, failed to get order details');
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  // 获取商家订单列表
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (searchKeyword) params.append('search', searchKeyword);

      const response = await axios.get(`http://localhost:3001/api/orders/merchant?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setTotal(response.data.data.total || 0);
      } else {
        message.error(response.data.message || (currentLanguage === 'zh' ? '获取订单失败' : 'Failed to get orders'));
      }
    } catch (error) {
      console.error('获取商家订单错误:', error);
      message.error(currentLanguage === 'zh' ? '网络错误，获取订单失败' : 'Network error, failed to get orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, searchKeyword]);

  // 页面加载时判断是显示列表还是详情
  useEffect(() => {
    if (user && user.role === 'merchant') {
      if (orderId) {
        fetchOrderDetail(orderId);
      } else {
        fetchOrders();
      }
    }
  }, [user, orderId, fetchOrders, fetchOrderDetail]);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // 重置筛选
  const handleResetFilters: CustomButtonProps['onClick'] = () => {
    setStatusFilter('');
    setSearchKeyword('');
    setCurrentPage(1);
    fetchOrders();
  };

  // 查看订单详情
  const viewOrderDetails = (orderId: number) => {
    navigate(`/merchant/orders/${orderId}`);
  };

  // 返回订单列表
  const backToList = () => {
    navigate('/merchant/orders');
  };

  // 更新订单状态
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!currentOrder) return;

    try {
      const response = await axios.put(`http://localhost:3001/api/orders/${currentOrder.id}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success(currentLanguage === 'zh' ? '订单状态更新成功' : 'Order status updated successfully');
        setCurrentOrder({ ...currentOrder, status: newStatus });
      } else {
        message.error(response.data.message || (currentLanguage === 'zh' ? '更新订单状态失败' : 'Failed to update order status'));
      }
    } catch (error) {
      console.error('更新订单状态错误:', error);
      message.error(currentLanguage === 'zh' ? '网络错误，更新订单状态失败' : 'Network error, failed to update order status');
    }
  };

  // 分页处理
  const totalPages = Math.ceil(total / pageSize);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 如果是显示订单详情
  if (orderId && currentOrder) {
    return (
      <div className="merchant-order-detail-page">
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={backToList}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                cursor: 'pointer',
                marginRight: '16px'
              }}
            >
              ← {currentLanguage === 'zh' ? '返回列表' : 'Back to List'}
            </button>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              {currentLanguage === 'zh' ? '订单详情' : 'Order Details'}
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#666' }}>加载中...</div>
            </div>
          ) : (
            <div>
              {/* 订单基本信息 */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {currentLanguage === 'zh' ? '基本信息' : 'Basic Information'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '订单编号：' : 'Order Number: '}</strong>
                    {currentOrder.order_number}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '产品名称：' : 'Product Name: '}</strong>
                    {currentOrder.product?.name || currentOrder.product?.title_zh || '未知产品'}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '出行日期：' : 'Travel Date: '}</strong>
                    {currentOrder.travel_date}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '客户姓名：' : 'Customer Name: '}</strong>
                    {currentOrder.customer_name}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '成人数量：' : 'Adults: '}</strong>
                    {currentOrder.adults}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '儿童数量：' : 'Children: '}</strong>
                    {currentOrder.children_no_bed || 0}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '订单金额：' : 'Total Amount: '}</strong>
                    ¥{currentOrder.total_price.toLocaleString()}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '订单状态：' : 'Status: '}</strong>
                    <span style={{ 
                      backgroundColor: statusConfig[currentOrder.status].color, 
                      color: '#fff', 
                      padding: '2px 6px', 
                      borderRadius: 4, 
                      fontSize: 12,
                      marginLeft: '8px'
                    }}>
                      {statusConfig[currentOrder.status].text}
                    </span>
                  </div>
                </div>
              </div>

              {/* 客户信息 */}
              {currentOrder.customer && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    {currentLanguage === 'zh' ? '客户信息' : 'Customer Information'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div>
                      <strong>{currentLanguage === 'zh' ? '用户名：' : 'Username: '}</strong>
                      {currentOrder.customer.username}
                    </div>
                    <div>
                      <strong>{currentLanguage === 'zh' ? '邮箱：' : 'Email: '}</strong>
                      {currentOrder.customer.email}
                    </div>
                    {currentOrder.customer.phone && (
                      <div>
                        <strong>{currentLanguage === 'zh' ? '电话：' : 'Phone: '}</strong>
                        {currentOrder.customer.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 备注信息 */}
              {currentOrder.notes && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    {currentLanguage === 'zh' ? '备注信息' : 'Notes'}
                  </h3>
                  <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: 4 }}>
                    {currentOrder.notes}
                  </div>
                </div>
              )}

              {/* 状态操作 */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {currentLanguage === 'zh' ? '状态操作' : 'Status Actions'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus('confirmed')}
                        style={{
                          padding: '6px 12px',
                          background: '#722ed1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {currentLanguage === 'zh' ? '确认订单' : 'Confirm Order'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus('cancelled')}
                        style={{
                          padding: '6px 12px',
                          background: '#f5222d',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {currentLanguage === 'zh' ? '取消订单' : 'Cancel Order'}
                      </button>
                    </>
                  )}
                  {currentOrder.status === 'paid' && (
                    <button
                      onClick={() => updateOrderStatus('confirmed')}
                      style={{
                        padding: '6px 12px',
                        background: '#722ed1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {currentLanguage === 'zh' ? '确认订单' : 'Confirm Order'}
                    </button>
                  )}
                  {currentOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus('completed')}
                      style={{
                        padding: '6px 12px',
                        background: '#52c41a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {currentLanguage === 'zh' ? '完成订单' : 'Complete Order'}
                    </button>
                  )}
                </div>
              </div>

              {/* 时间信息 */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {currentLanguage === 'zh' ? '时间信息' : 'Time Information'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '创建时间：' : 'Created At: '}</strong>
                    {new Date(currentOrder.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>{currentLanguage === 'zh' ? '更新时间：' : 'Updated At: '}</strong>
                    {new Date(currentOrder.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 显示订单列表
  return (
    <div className="merchant-order-page">
      <div style={{ 
        background: '#fff', 
        padding: '24px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
          {currentLanguage === 'zh' ? '商家订单管理' : 'Merchant Order Management'}
        </h2>
        
        <div className="filter-bar" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder={currentLanguage === 'zh' ? '搜索订单号/客户姓名' : 'Search order number/customer name'}
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              style={{ width: 250, padding: '6px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 180, padding: '6px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
            >
              <option value="">{currentLanguage === 'zh' ? '全部状态' : 'All Status'}</option>
              <option value="pending">{statusConfig.pending.text}</option>
              <option value="paid">{statusConfig.paid.text}</option>
              <option value="confirmed">{statusConfig.confirmed.text}</option>
              <option value="completed">{statusConfig.completed.text}</option>
              <option value="cancelled">{statusConfig.cancelled.text}</option>
              <option value="refunding">{statusConfig.refunding.text}</option>
              <option value="refunded">{statusConfig.refunded.text}</option>
            </select>
            <button onClick={handleSearch} style={{ padding: '6px 12px', background: '#1890ff', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
              {currentLanguage === 'zh' ? '筛选' : 'Filter'}
            </button>
            <button onClick={handleResetFilters} style={{ padding: '6px 12px', background: '#f0f0f0', borderRadius: 4, border: '1px solid #d9d9d9', cursor: 'pointer' }}>
              {currentLanguage === 'zh' ? '重置' : 'Reset'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>加载中...</div>
          </div>
        ) : (
          <div>
            {/* 原生HTML表格 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '订单编号' : 'Order Number'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '产品名称' : 'Product Name'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '出行日期' : 'Travel Date'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '客户姓名' : 'Customer Name'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '成人/儿童' : 'Adults/Children'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '订单金额' : 'Amount'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '订单状态' : 'Status'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '创建时间' : 'Created At'}
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                      {currentLanguage === 'zh' ? '操作' : 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        {currentLanguage === 'zh' ? '暂无订单数据' : 'No order data'}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.orderId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px 8px' }}>{order.orderNumber}</td>
                        <td style={{ padding: '12px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.productTitle}
                        </td>
                        <td style={{ padding: '12px 8px' }}>{order.travelDate}</td>
                        <td style={{ padding: '12px 8px' }}>{order.customerName}</td>
                        <td style={{ padding: '12px 8px' }}>{order.adultCount}/{order.childCount}</td>
                        <td style={{ padding: '12px 8px' }}>¥{order.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ 
                            backgroundColor: statusConfig[order.status].color, 
                            color: '#fff', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: 12 
                          }}>
                            {statusConfig[order.status].text}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{new Date(order.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => viewOrderDetails(order.orderId)}
                            style={{ 
                              padding: '4px 8px', 
                              background: '#1890ff', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: 4, 
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {currentLanguage === 'zh' ? '查看' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d9d9d9',
                    background: currentPage <= 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    borderRadius: 4
                  }}
                >
                  上一页
                </button>
                
                <span style={{ margin: '0 16px', fontSize: '14px' }}>
                  第 {currentPage} 页，共 {totalPages} 页，共 {total} 条记录
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d9d9d9',
                    background: currentPage >= totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: 4
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;