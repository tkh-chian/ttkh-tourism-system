import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  Users, 
  ShoppingBag, 
  Store, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalMerchants: number;
  totalProducts: number;
  totalOrders: number;
  pendingApprovals: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMerchants: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        setStats({
          totalUsers: 1250,
          totalMerchants: 85,
          totalProducts: 342,
          totalOrders: 1876,
          pendingApprovals: 12,
          totalRevenue: 125680
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取统计数据失败:', error);
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
          {language === 'zh' ? '管理员控制台' : 'แดชบอร์ดผู้ดูแลระบบ'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '系统概览和管理功能' : 'ภาพรวมระบบและฟังก์ชันการจัดการ'}
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
                {language === 'zh' ? '总用户数' : 'ผู้ใช้ทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Store className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '商家数量' : 'จำนวนผู้ขาย'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalMerchants.toLocaleString()}
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
                {language === 'zh' ? '产品总数' : 'ผลิตภัณฑ์ทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalProducts.toLocaleString()}
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
                {language === 'zh' ? '总收入' : 'รายได้รวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ¥{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 待处理事项 */}
      {stats.pendingApprovals > 0 && (
        <Card className="p-6 mb-8 border-l-4 border-orange-500">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-orange-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'zh' ? '待处理事项' : 'รายการรอดำเนินการ'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'zh' 
                  ? `有 ${stats.pendingApprovals} 个商家申请等待审核`
                  : `มี ${stats.pendingApprovals} คำขอจากผู้ขายรอการอนุมัติ`
                }
              </p>
            </div>
            <div className="ml-auto">
              <Link to="/admin/merchants">
                <Button size="sm">
                  {language === 'zh' ? '立即处理' : 'ดำเนินการทันที'}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/users">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '用户管理' : 'จัดการผู้ใช้'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '管理系统用户' : 'จัดการผู้ใช้ระบบ'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/merchants">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Store className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '商家管理' : 'จัดการผู้ขาย'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '审核和管理商家' : 'อนุมัติและจัดการผู้ขาย'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/products">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '产品管理' : 'จัดการผลิตภัณฑ์'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '审核和管理产品' : 'อนุมัติและจัดการผลิตภัณฑ์'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/orders">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '订单管理' : 'จัดการคำสั่งซื้อ'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '监控和管理订单' : 'ติดตามและจัดการคำสั่งซื้อ'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/categories">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">分</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '分类管理' : 'จัดการหมวดหมู่'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '管理产品分类' : 'จัดการหมวดหมู่ผลิตภัณฑ์'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-gray-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">设</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '系统设置' : 'ตั้งค่าระบบ'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '系统配置和设置' : 'การกำหนดค่าและตั้งค่าระบบ'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* 最近活动 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {language === 'zh' ? '最近活动' : 'กิจกรรมล่าสุด'}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                {language === 'zh' ? '商家 "泰国旅游专家" 的产品 "普吉岛三日游" 已通过审核' : 'ผลิตภัณฑ์ "ทัวร์ภูเก็ต 3 วัน" ของผู้ขาย "ผู้เชี่ยวชาญท่องเที่ยวไทย" ได้รับการอนุมัติแล้ว'}
              </p>
              <p className="text-xs text-gray-500">2 小时前</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                {language === 'zh' ? '新商家 "清迈本地游" 提交了入驻申请' : 'ผู้ขายใหม่ "ทัวร์ท้องถิ่นเชียงใหม่" ส่งคำขอเข้าร่วม'}
              </p>
              <p className="text-xs text-gray-500">4 小时前</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                {language === 'zh' ? '今日订单量达到 156 单，比昨日增长 12%' : 'คำสั่งซื้อวันนี้ถึง 156 รายการ เพิ่มขึ้น 12% จากเมื่อวาน'}
              </p>
              <p className="text-xs text-gray-500">6 小时前</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;