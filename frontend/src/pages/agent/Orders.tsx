import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { 
  ShoppingBag, 
  Calendar, 
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Eye
} from 'lucide-react';

interface Order {
  id: number;
  order_no: string;
  customer_name: string;
  customer_email: string;
  product_title: string;
  merchant_name: string;
  travel_date: string;
  total_people: number;
  final_amount: number;
  status: string;
  created_at: string;
  customer_phone?: string;
  notes?: string;
}

const AgentOrders: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取订单列表失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, text: language === 'zh' ? '待确认' : 'รอยืนยัน' },
      confirmed: { variant: 'success' as const, text: language === 'zh' ? '已确认' : 'ยืนยันแล้ว' },
      rejected: { variant: 'danger' as const, text: language === 'zh' ? '已拒绝' : 'ปฏิเสธ' },
      completed: { variant: 'success' as const, text: language === 'zh' ? '已完成' : 'เสร็จสิ้น' },
      cancelled: { variant: 'secondary' as const, text: language === 'zh' ? '已取消' : 'ยกเลิก' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      variant: 'secondary' as const, 
      text: status 
    };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const filteredAndSortedOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return b.final_amount - a.final_amount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
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
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'zh' ? '订单管理' : 'จัดการคำสั่งซื้อ'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '查看您推荐客户的订单' : 'ดูคำสั่งซื้อของลูกค้าที่คุณแนะนำ'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总订单数' : 'คำสั่งซื้อทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.length}
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
                {language === 'zh' ? '总金额' : 'ยอดรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(orders.reduce((sum, order) => sum + order.final_amount, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '待确认' : 'รอยืนยัน'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '已确认' : 'ยืนยันแล้ว'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(order => order.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={language === 'zh' ? '搜索订单号、客户姓名或产品...' : 'ค้นหาหมายเลขคำสั่งซื้อ ชื่อลูกค้า หรือผลิตภัณฑ์...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{language === 'zh' ? '全部状态' : 'สถานะทั้งหมด'}</option>
              <option value="pending">{language === 'zh' ? '待确认' : 'รอยืนยัน'}</option>
              <option value="confirmed">{language === 'zh' ? '已确认' : 'ยืนยันแล้ว'}</option>
              <option value="completed">{language === 'zh' ? '已完成' : 'เสร็จสิ้น'}</option>
              <option value="cancelled">{language === 'zh' ? '已取消' : 'ยกเลิก'}</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">{language === 'zh' ? '按时间排序' : 'เรียงตามเวลา'}</option>
              <option value="amount">{language === 'zh' ? '按金额排序' : 'เรียงตามยอดเงิน'}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 订单列表 */}
      <div className="space-y-6">
        {filteredAndSortedOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {order.order_no}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  {language === 'zh' ? '查看' : 'ดู'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {language === 'zh' ? '客户信息' : 'ข้อมูลลูกค้า'}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-900">
                    <User className="h-4 w-4 mr-2" />
                    {order.customer_name}
                  </div>
                  {order.customer_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {order.customer_email}
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.customer_phone}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {language === 'zh' ? '产品信息' : 'ข้อมูลผลิตภัณฑ์'}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900 font-medium">
                    {order.product_title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'zh' ? '商家: ' : 'ร้านค้า: '}{order.merchant_name}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(order.travel_date)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {language === 'zh' ? '订单详情' : 'รายละเอียดคำสั่งซื้อ'}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">
                    {language === 'zh' ? '人数: ' : 'จำนวนคน: '}{order.total_people} {language === 'zh' ? '人' : 'คน'}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(order.final_amount)}
                  </p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {language === 'zh' ? '备注' : 'หมายเหตุ'}
                </p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredAndSortedOrders.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'zh' ? '暂无订单' : 'ไม่มีคำสั่งซื้อ'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? (language === 'zh' ? '没有找到符合条件的订单' : 'ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข')
              : (language === 'zh' ? '您的客户还没有创建订单' : 'ลูกค้าของคุณยังไม่ได้สร้างคำสั่งซื้อ')
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default AgentOrders;

// 确保这是一个模块
export {};
