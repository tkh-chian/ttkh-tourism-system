import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { 
  TrendingUp, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  ShoppingBag,
  DollarSign
} from 'lucide-react';

interface Order {
  id: number;
  order_no: string;
  user_id: number;
  merchant_id: number;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  user_name?: string;
  merchant_name?: string;
  product_title?: string;
}

const AdminOrders: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        const mockOrders: Order[] = [
          {
            id: 1,
            order_no: 'ORD20240101001',
            user_id: 3,
            merchant_id: 2,
            total_amount: 1000,
            shipping_fee: 0,
            discount_amount: 100,
            final_amount: 900,
            status: 'paid',
            payment_method: 'alipay',
            payment_status: 'paid',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T11:00:00Z',
            user_name: '张三',
            merchant_name: '泰国旅游专家',
            product_title: '曼谷一日游'
          },
          {
            id: 2,
            order_no: 'ORD20240102001',
            user_id: 4,
            merchant_id: 2,
            total_amount: 2000,
            shipping_fee: 0,
            discount_amount: 0,
            final_amount: 2000,
            status: 'pending',
            payment_method: 'wechat',
            payment_status: 'pending',
            created_at: '2024-02-01T14:20:00Z',
            updated_at: '2024-02-01T14:20:00Z',
            user_name: '李四',
            merchant_name: '清迈本地游',
            product_title: '清迈两日游'
          }
        ];
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user_name && order.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.product_title && order.product_title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    setFilteredOrders(filtered);
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': language === 'zh' ? '待付款' : 'รอชำระเงิน',
      'paid': language === 'zh' ? '已付款' : 'ชำระแล้ว',
      'shipped': language === 'zh' ? '已发货' : 'จัดส่งแล้ว',
      'delivered': language === 'zh' ? '已送达' : 'ส่งถึงแล้ว',
      'cancelled': language === 'zh' ? '已取消' : 'ยกเลิกแล้ว',
      'refunded': language === 'zh' ? '已退款' : 'คืนเงินแล้ว'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'warning',
      'paid': 'success',
      'shipped': 'info',
      'delivered': 'success',
      'cancelled': 'secondary',
      'refunded': 'danger'
    };
    return colorMap[status as keyof typeof colorMap] || 'secondary';
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap = {
      'pending': language === 'zh' ? '待支付' : 'รอชำระ',
      'paid': language === 'zh' ? '已支付' : 'ชำระแล้ว',
      'failed': language === 'zh' ? '支付失败' : 'ชำระไม่สำเร็จ',
      'refunded': language === 'zh' ? '已退款' : 'คืนเงินแล้ว'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'zh' ? '订单管理' : 'จัดการคำสั่งซื้อ'}
            </h1>
            <p className="mt-2 text-gray-600">
              {language === 'zh' ? '监控和管理平台订单' : 'ติดตามและจัดการคำสั่งซื้อในแพลตฟอร์ม'}
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '待付款' : 'รอชำระเงิน'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '已付款' : 'ชำระแล้ว'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(o => o.status === 'paid').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '已完成' : 'เสร็จสิ้น'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总订单' : 'ทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={language === 'zh' ? '搜索订单号或用户名' : 'ค้นหาหมายเลขคำสั่งซื้อหรือชื่อผู้ใช้'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'zh' ? '所有状态' : 'ทุกสถานะ'}</option>
            <option value="pending">{language === 'zh' ? '待付款' : 'รอชำระเงิน'}</option>
            <option value="paid">{language === 'zh' ? '已付款' : 'ชำระแล้ว'}</option>
            <option value="shipped">{language === 'zh' ? '已发货' : 'จัดส่งแล้ว'}</option>
            <option value="delivered">{language === 'zh' ? '已送达' : 'ส่งถึงแล้ว'}</option>
            <option value="cancelled">{language === 'zh' ? '已取消' : 'ยกเลิกแล้ว'}</option>
            <option value="refunded">{language === 'zh' ? '已退款' : 'คืนเงินแล้ว'}</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {language === 'zh' ? `共 ${filteredOrders.length} 个订单` : `ทั้งหมด ${filteredOrders.length} คำสั่งซื้อ`}
          </div>
        </div>
      </Card>

      {/* 订单列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '订单信息' : 'ข้อมูลคำสั่งซื้อ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '用户' : 'ผู้ใช้'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '产品' : 'ผลิตภัณฑ์'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '金额' : 'จำนวนเงิน'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '状态' : 'สถานะ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '下单时间' : 'วันที่สั่งซื้อ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '操作' : 'การดำเนินการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_no}
                      </div>
                      <div className="text-sm text-gray-500">
                        {language === 'zh' ? '支付方式' : 'วิธีชำระ'}: {order.payment_method || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {order.user_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.product_title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.merchant_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">¥{order.final_amount}</div>
                      {order.discount_amount > 0 && (
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '优惠' : 'ส่วนลด'}: ¥{order.discount_amount}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <Badge variant={getStatusColor(order.status) as any}>
                        {getStatusText(order.status)}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {getPaymentStatusText(order.payment_status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {language === 'zh' ? '没有找到订单' : 'ไม่พบคำสั่งซื้อ'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件' : 'ลองปรับเงื่อนไขการค้นหา'}
            </p>
          </div>
        )}
      </Card>

      {/* 订单详情模态框 */}
      {showOrderModal && selectedOrder && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={language === 'zh' ? '订单详情' : 'รายละเอียดคำสั่งซื้อ'}
        >
          <div className="space-y-6">
            {/* 订单基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '订单信息' : 'ข้อมูลคำสั่งซื้อ'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '订单号' : 'หมายเลขคำสั่งซื้อ'}
                  </label>
                  <Input
                    type="text"
                    value={selectedOrder.order_no}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '下单时间' : 'วันที่สั่งซื้อ'}
                  </label>
                  <Input
                    type="text"
                    value={new Date(selectedOrder.created_at).toLocaleString()}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* 用户和商家信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '相关信息' : 'ข้อมูลที่เกี่ยวข้อง'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '用户' : 'ผู้ใช้'}
                  </label>
                  <Input
                    type="text"
                    value={selectedOrder.user_name || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '商家' : 'ผู้ขาย'}
                  </label>
                  <Input
                    type="text"
                    value={selectedOrder.merchant_name || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '产品' : 'ผลิตภัณฑ์'}
                </label>
                <Input
                  type="text"
                  value={selectedOrder.product_title || ''}
                  disabled
                />
              </div>
            </div>

            {/* 金额信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '金额信息' : 'ข้อมูลจำนวนเงิน'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '商品金额' : 'จำนวนเงินสินค้า'}
                  </label>
                  <Input
                    type="text"
                    value={`¥${selectedOrder.total_amount}`}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '运费' : 'ค่าจัดส่ง'}
                  </label>
                  <Input
                    type="text"
                    value={`¥${selectedOrder.shipping_fee}`}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '优惠金额' : 'จำนวนส่วนลด'}
                  </label>
                  <Input
                    type="text"
                    value={`¥${selectedOrder.discount_amount}`}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '实付金额' : 'จำนวนเงินที่ชำระ'}
                  </label>
                  <Input
                    type="text"
                    value={`¥${selectedOrder.final_amount}`}
                    disabled
                    className="font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 状态信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '状态信息' : 'ข้อมูลสถานะ'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '订单状态' : 'สถานะคำสั่งซื้อ'}
                  </label>
                  <Badge variant={getStatusColor(selectedOrder.status) as any}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '支付状态' : 'สถานะการชำระเงิน'}
                  </label>
                  <div className="text-sm text-gray-900">
                    {getPaymentStatusText(selectedOrder.payment_status)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '支付方式' : 'วิธีการชำระเงิน'}
                </label>
                <Input
                  type="text"
                  value={selectedOrder.payment_method || 'N/A'}
                  disabled
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrders;