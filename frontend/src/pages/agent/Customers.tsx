import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  ShoppingBag,
  DollarSign,
  UserPlus
} from 'lucide-react';

interface Customer {
  id: number;
  username: string;
  email: string;
  phone: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

const AgentCustomers: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'date'>('date');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/agent/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取客户列表失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.data);
      } else {
        throw new Error(result.message || '获取客户列表失败');
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => 
      customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.username.localeCompare(b.username);
        case 'orders':
          return b.order_count - a.order_count;
        case 'spent':
          return b.total_spent - a.total_spent;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
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
          {language === 'zh' ? '客户管理' : 'จัดการลูกค้า'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '管理您推荐的客户' : 'จัดการลูกค้าที่คุณแนะนำ'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总客户数' : 'ลูกค้าทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总订单数' : 'คำสั่งซื้อทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.reduce((sum, customer) => sum + customer.order_count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总消费额' : 'ยอดใช้จ่ายรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(customers.reduce((sum, customer) => sum + customer.total_spent, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '活跃客户' : 'ลูกค้าที่ใช้งาน'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(customer => customer.order_count > 0).length}
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
              placeholder={language === 'zh' ? '搜索客户姓名、邮箱或电话...' : 'ค้นหาชื่อ อีเมล หรือเบอร์โทร...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">{language === 'zh' ? '按注册时间' : 'เรียงตามวันที่สมัคร'}</option>
              <option value="name">{language === 'zh' ? '按姓名' : 'เรียงตามชื่อ'}</option>
              <option value="orders">{language === 'zh' ? '按订单数' : 'เรียงตามจำนวนคำสั่งซื้อ'}</option>
              <option value="spent">{language === 'zh' ? '按消费额' : 'เรียงตามยอดใช้จ่าย'}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 客户列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedCustomers.map((customer) => (
          <Card key={customer.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {customer.username}
                  </h3>
                  <div className="flex items-center mt-1">
                    {customer.order_count > 0 ? (
                      <Badge variant="success">
                        {language === 'zh' ? '活跃客户' : 'ลูกค้าใช้งาน'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {language === 'zh' ? '潜在客户' : 'ลูกค้าเป้าหมาย'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {customer.phone}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {language === 'zh' ? '注册时间: ' : 'วันที่สมัคร: '}{formatDate(customer.created_at)}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {customer.order_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'zh' ? '订单数' : 'คำสั่งซื้อ'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(customer.total_spent)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'zh' ? '总消费' : 'ยอดใช้จ่าย'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {customer.last_order_date 
                      ? formatDate(customer.last_order_date)
                      : language === 'zh' ? '无订单' : 'ไม่มีคำสั่งซื้อ'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'zh' ? '最后订单' : 'คำสั่งซื้อล่าสุด'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                {language === 'zh' ? '查看详情' : 'ดูรายละเอียด'}
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                {language === 'zh' ? '联系客户' : 'ติดต่อลูกค้า'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredAndSortedCustomers.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'zh' ? '暂无客户' : 'ไม่มีลูกค้า'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'zh' ? '您还没有推荐的客户，开始邀请客户加入吧！' : 'คุณยังไม่มีลูกค้าที่แนะนำ เริ่มเชิญลูกค้าเข้าร่วมกันเถอะ!'}
          </p>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            {language === 'zh' ? '邀请客户' : 'เชิญลูกค้า'}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AgentCustomers;

// 确保这是一个模块
export {};
