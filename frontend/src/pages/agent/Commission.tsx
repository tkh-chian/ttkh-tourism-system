import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Download,
  Filter,
  ShoppingBag,
  User
} from 'lucide-react';

interface Commission {
  id: number;
  order_number: string;
  total_amount: number;
  commission_amount: number;
  commission_rate: number;
  created_at: string;
  customer_name: string;
  product_title: string;
}

interface CommissionSummary {
  totalCommission: number;
  totalRevenue: number;
  orderCount: number;
}

const AgentCommission: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalCommission: 0,
    totalRevenue: 0,
    orderCount: 0
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('month');

  useEffect(() => {
    fetchCommissions();
  }, [startDate, endDate, dateRange]);

  useEffect(() => {
    // 根据选择的时间范围设置日期
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (dateRange) {
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        setStartDate(monthStart);
        setEndDate(today);
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        setStartDate(quarterStart);
        setEndDate(today);
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        setStartDate(yearStart);
        setEndDate(today);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      // custom 情况下不自动设置日期
    }
  }, [dateRange]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/agent/commission';
      const params = new URLSearchParams();
      
      if (startDate && endDate && dateRange !== 'all') {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取佣金报告失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCommissions(result.data.commissions);
        setSummary(result.data.summary);
      } else {
        throw new Error(result.message || '获取佣金报告失败');
      }
    } catch (error) {
      console.error('获取佣金报告失败:', error);
      setCommissions([]);
      setSummary({
        totalCommission: 0,
        totalRevenue: 0,
        orderCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const exportCommissions = () => {
    // 简单的CSV导出功能
    const headers = ['订单号', '客户姓名', '产品名称', '订单金额', '佣金金额', '佣金率', '创建时间'];
    const csvContent = [
      headers.join(','),
      ...commissions.map(commission => [
        commission.order_number,
        commission.customer_name,
        commission.product_title,
        commission.total_amount,
        commission.commission_amount,
        `${commission.commission_rate}%`,
        formatDate(commission.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `佣金报告_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {language === 'zh' ? '佣金报告' : 'รายงานคอมมิชชั่น'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '查看您的佣金收入明细' : 'ดูรายละเอียดรายได้คอมมิชชั่น'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总佣金' : 'คอมมิชชั่นรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary.totalCommission)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总销售额' : 'ยอดขายรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '订单数量' : 'จำนวนคำสั่งซื้อ'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.orderCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 筛选和导出 */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {language === 'zh' ? '时间范围:' : 'ช่วงเวลา:'}
              </span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{language === 'zh' ? '全部时间' : 'ทั้งหมด'}</option>
              <option value="month">{language === 'zh' ? '本月' : 'เดือนนี้'}</option>
              <option value="quarter">{language === 'zh' ? '本季度' : 'ไตรมาสนี้'}</option>
              <option value="year">{language === 'zh' ? '本年' : 'ปีนี้'}</option>
              <option value="custom">{language === 'zh' ? '自定义' : 'กำหนดเอง'}</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <Button onClick={exportCommissions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {language === 'zh' ? '导出报告' : 'ส่งออกรายงาน'}
          </Button>
        </div>
      </Card>

      {/* 佣金明细表 */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {language === 'zh' ? '佣金明细' : 'รายละเอียดคอมมิชชั่น'}
          </h3>
        </div>
        
        {commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '订单信息' : 'ข้อมูลคำสั่งซื้อ'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '客户' : 'ลูกค้า'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '产品' : 'ผลิตภัณฑ์'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '订单金额' : 'ยอดคำสั่งซื้อ'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '佣金率' : 'อัตราคอมมิชชั่น'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '佣金金额' : 'จำนวนคอมมิชชั่น'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '时间' : 'เวลา'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {commission.order_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {commission.customer_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {commission.product_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(commission.total_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Badge variant="secondary">
                        {commission.commission_rate || 10}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(commission.commission_amount || (commission.total_amount * (commission.commission_rate || 10) / 100))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {formatDate(commission.created_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'zh' ? '暂无佣金记录' : 'ไม่มีบันทึกคอมมิชชั่น'}
            </h3>
            <p className="text-gray-500">
              {language === 'zh' ? '当前时间范围内没有佣金记录' : 'ไม่มีบันทึกคอมมิชชั่นในช่วงเวลานี้'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AgentCommission;

// 确保这是一个模块
export {};