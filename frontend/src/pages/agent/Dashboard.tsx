import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  Users, 
  ShoppingBag, 
  DollarSign,
  UserPlus,
  Award,
  Target,
  BarChart3
} from 'lucide-react';

interface AgentStats {
  totalCustomers: number;
  totalOrders: number;
  totalCommission: number;
  monthlyRevenue: number;
  conversionRate: number;
  activeCustomers: number;
}

const AgentDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalCommission: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    activeCustomers: 0
  });

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/agent/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStats({
          totalCustomers: result.data.totalCustomers,
          totalOrders: result.data.totalOrders,
          totalCommission: result.data.totalCommission,
          monthlyRevenue: result.data.monthlyRevenue,
          conversionRate: result.data.conversionRate,
          activeCustomers: result.data.activeCustomers
        });
      } else {
        throw new Error(result.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取代理统计数据失败:', error);
      // 如果API调用失败，显示默认数据
      setStats({
        totalCustomers: 0,
        totalOrders: 0,
        totalCommission: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        activeCustomers: 0
      });
    } finally {
      setLoading(false);
    }
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
          {language === 'zh' ? '代理商控制台' : 'แดชบอร์ดตัวแทน'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '管理您的客户和销售业绩' : 'จัดการลูกค้าและผลงานการขาย'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {stats.totalCustomers}
              </p>
              <p className="text-xs text-green-600">
                {language === 'zh' ? `活跃: ${stats.activeCustomers}` : `ใช้งาน: ${stats.activeCustomers}`}
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
                {stats.totalOrders}
              </p>
              <p className="text-xs text-blue-600">
                {language === 'zh' ? '本月: 28' : 'เดือนนี้: 28'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总佣金' : 'คอมมิชชั่นรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ¥{stats.totalCommission.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">
                {language === 'zh' ? '本月: ¥3,280' : 'เดือนนี้: ¥3,280'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '转化率' : 'อัตราการแปลง'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.conversionRate}%
              </p>
              <p className="text-xs text-green-600">
                {language === 'zh' ? '+2.5%' : '+2.5%'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/agent/customers">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '客户管理' : 'จัดการลูกค้า'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '管理和跟进客户' : 'จัดการและติดตามลูกค้า'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/agent/orders">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '订单管理' : 'จัดการคำสั่งซื้อ'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '查看客户订单' : 'ดูคำสั่งซื้อลูกค้า'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/agent/commission">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '佣金报告' : 'รายงานคอมมิชชั่น'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '查看佣金明细' : 'ดูรายละเอียดคอมมิชชั่น'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/agent/performance">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '业绩分析' : 'วิเคราะห์ผลงาน'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '销售数据分析' : 'วิเคราะห์ข้อมูลการขาย'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/agent/products">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">产</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '产品推广' : 'โปรโมทผลิตภัณฑ์'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '推广产品给客户' : 'โปรโมทผลิตภัณฑ์ให้ลูกค้า'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/agent/invite">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-pink-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlus className="h-8 w-8 text-pink-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '邀请客户' : 'เชิญลูกค้า'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '邀请新客户注册' : 'เชิญลูกค้าใหม่สมัครสมาชิก'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* 业绩图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {language === 'zh' ? '月度销售趋势' : 'แนวโน้มการขายรายเดือน'}
          </h3>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {language === 'zh' ? '图表数据加载中...' : 'กำลังโหลดข้อมูลกราฟ...'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {language === 'zh' ? '客户转化漏斗' : 'ช่องทางการแปลงลูกค้า'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {language === 'zh' ? '潜在客户' : 'ลูกค้าเป้าหมาย'}
              </span>
              <span className="font-medium">245</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {language === 'zh' ? '意向客户' : 'ลูกค้าที่สนใจ'}
              </span>
              <span className="font-medium">189</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '77%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {language === 'zh' ? '成交客户' : 'ลูกค้าที่ซื้อ'}
              </span>
              <span className="font-medium">156</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
        </Card>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {language === 'zh' ? '最近订单' : 'คำสั่งซื้อล่าสุด'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">张小明</p>
                  <p className="text-sm text-gray-500">普吉岛三日游</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">¥2,580</p>
                <p className="text-sm text-green-600">佣金: ¥258</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">李小红</p>
                  <p className="text-sm text-gray-500">清迈文化之旅</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">¥1,890</p>
                <p className="text-sm text-green-600">佣金: ¥189</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {language === 'zh' ? '热门推荐产品' : 'ผลิตภัณฑ์แนะนำยอดนิยม'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">苏梅岛度假套餐</p>
                  <p className="text-sm text-gray-500">佣金率: 10%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">¥3,280</p>
                <Button size="sm" variant="outline">推广</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">曼谷美食探索</p>
                  <p className="text-sm text-gray-500">佣金率: 12%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">¥1,580</p>
                <Button size="sm" variant="outline">推广</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
