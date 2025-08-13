import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Calendar,
  User,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';

interface UserStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  favoriteProducts: number;
  totalSpent: number;
}

const UserDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    favoriteProducts: 0,
    totalSpent: 0
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        setStats({
          totalOrders: 12,
          completedOrders: 8,
          pendingOrders: 2,
          favoriteProducts: 15,
          totalSpent: 8650
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
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
          {language === 'zh' ? '我的控制台' : 'แดชบอร์ดของฉัน'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '管理您的订单和个人信息' : 'จัดการคำสั่งซื้อและข้อมูลส่วนตัว'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '已完成' : 'เสร็จสิ้นแล้ว'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedOrders}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '进行中' : 'กำลังดำเนินการ'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendingOrders}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总消费' : 'ยอดใช้จ่ายรวม'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ¥{stats.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/orders">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '我的订单' : 'คำสั่งซื้อของฉัน'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '查看和管理订单' : 'ดูและจัดการคำสั่งซื้อ'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/profile">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '个人资料' : 'ข้อมูลส่วนตัว'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '编辑个人信息' : 'แก้ไขข้อมูลส่วนตัว'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/favorites">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'zh' ? '我的收藏' : 'รายการโปรด'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? `${stats.favoriteProducts} 个产品` : `${stats.favoriteProducts} ผลิตภัณฑ์`}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* 最近订单 */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {language === 'zh' ? '最近订单' : 'คำสั่งซื้อล่าสุด'}
          </h3>
          <Link to="/orders">
            <Button variant="outline" size="sm">
              {language === 'zh' ? '查看全部' : 'ดูทั้งหมด'}
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'zh' ? '普吉岛三日游' : 'ทัวร์ภูเก็ต 3 วัน'}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '订单号: #TK2025001' : 'หมายเลขคำสั่งซื้อ: #TK2025001'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">¥2,580</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {language === 'zh' ? '已完成' : 'เสร็จสิ้น'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'zh' ? '清迈文化之旅' : 'ทัวร์วัฒนธรรมเชียงใหม่'}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'zh' ? '订单号: #TK2025002' : 'หมายเลขคำสั่งซื้อ: #TK2025002'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">¥1,890</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {language === 'zh' ? '进行中' : 'กำลังดำเนินการ'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 推荐产品 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {language === 'zh' ? '为您推荐' : 'แนะนำสำหรับคุณ'}
          </h3>
          <Link to="/">
            <Button variant="outline" size="sm">
              {language === 'zh' ? '浏览更多' : 'เรียกดูเพิ่มเติม'}
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 mb-3">
              <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">
              {language === 'zh' ? '苏梅岛度假套餐' : 'แพ็คเกจพักผ่อนเกาะสมุย'}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              {language === 'zh' ? '4天3夜豪华度假' : 'พักผ่อนหรู 4 วัน 3 คืน'}
            </p>
            <p className="font-semibold text-primary-600">¥3,280</p>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 mb-3">
              <div className="w-full h-32 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">
              {language === 'zh' ? '曼谷美食探索' : 'สำรวจอาหารกรุงเทพ'}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              {language === 'zh' ? '2天1夜美食之旅' : 'ทัวร์อาหาร 2 วัน 1 คืน'}
            </p>
            <p className="font-semibold text-primary-600">¥1,580</p>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 mb-3">
              <div className="w-full h-32 bg-gradient-to-r from-purple-400 to-purple-600 rounded"></div>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">
              {language === 'zh' ? '华欣海滨度假' : 'พักผ่อนชายทะเลหัวหิน'}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              {language === 'zh' ? '3天2夜海滨体验' : 'ประสบการณ์ชายทะเล 3 วัน 2 คืน'}
            </p>
            <p className="font-semibold text-primary-600">¥2,180</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserDashboard;