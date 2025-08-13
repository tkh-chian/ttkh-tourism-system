import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { 
  Store, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface Merchant {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  name?: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminMerchants: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    filterMerchants();
  }, [merchants, searchTerm, selectedStatus]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      
      // 获取认证令牌
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('未找到认证令牌');
        setLoading(false);
        return;
      }

      console.log('🔑 使用令牌发送API请求:', token.substring(0, 20) + '...');
      
      // 从后端API获取商家数据
      const response = await fetch('http://localhost:3001/api/admin/merchants', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API错误:', errorData);
        throw new Error(`获取商家列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API返回数据:', data);
      
      if (data.success && data.data && data.data.users) {
        console.log('✅ 成功获取商家数据，数量:', data.data.users.length);
        setMerchants(data.data.users);
      } else {
        console.log('⚠️ API返回数据格式异常');
        setMerchants([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ 获取商家列表失败:', error);
      setMerchants([]);
      setLoading(false);
    }
  };

  const filterMerchants = () => {
    let filtered = merchants;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(merchant => 
        (merchant.username && merchant.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (merchant.company_name && merchant.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (merchant.contact_person && merchant.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (merchant.email && merchant.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(merchant => merchant.status === selectedStatus);
    }

    setFilteredMerchants(filtered);
  };

  const handleStatusChange = async (merchantId: string, newStatus: string, reason?: string) => {
    try {
      // 调用后端API更新商家状态
      const response = await fetch(`http://localhost:3001/api/admin/users/${merchantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          reason: reason
        })
      });
      
      if (!response.ok) {
        throw new Error('更新商家状态失败');
      }
      
      await fetchMerchants();
      setShowMerchantModal(false);
    } catch (error) {
      console.error('更新商家状态失败:', error);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': language === 'zh' ? '待审核' : 'รอการอนุมัติ',
      'approved': language === 'zh' ? '已批准' : 'อนุมัติแล้ว',
      'rejected': language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว',
      'suspended': language === 'zh' ? '已暂停' : 'ระงับการใช้งาน'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger',
      'suspended': 'secondary'
    };
    return colorMap[status as keyof typeof colorMap] || 'secondary';
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
          <Store className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'zh' ? '商家管理' : 'จัดการผู้ขาย'}
            </h1>
            <p className="mt-2 text-gray-600">
              {language === 'zh' ? '审核和管理平台商家' : 'อนุมัติและจัดการผู้ขายในแพลตฟอร์ม'}
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '待审核' : 'รอการอนุมัติ'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {merchants.filter(m => m.status === 'pending').length}
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
                {language === 'zh' ? '已批准' : 'อนุมัติแล้ว'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {merchants.filter(m => m.status === 'approved').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {merchants.filter(m => m.status === 'rejected').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '总数' : 'ทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {merchants.length}
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
              placeholder={language === 'zh' ? '搜索店铺名称或联系人' : 'ค้นหาชื่อร้านหรือผู้ติดต่อ'}
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
            <option value="pending">{language === 'zh' ? '待审核' : 'รอการอนุมัติ'}</option>
            <option value="approved">{language === 'zh' ? '已批准' : 'อนุมัติแล้ว'}</option>
            <option value="rejected">{language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว'}</option>
            <option value="suspended">{language === 'zh' ? '已暂停' : 'ระงับการใช้งาน'}</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {language === 'zh' ? `共 ${filteredMerchants.length} 个商家` : `ทั้งหมด ${filteredMerchants.length} ผู้ขาย`}
          </div>
        </div>
      </Card>

      {/* 商家列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '店铺信息' : 'ข้อมูลร้านค้า'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '联系信息' : 'ข้อมูลติดต่อ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '状态' : 'สถานะ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '申请时间' : 'วันที่สมัคร'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '操作' : 'การดำเนินการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {merchant.company_name || merchant.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {merchant.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {merchant.email}
                      </div>
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {merchant.phone || '未提供'}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {merchant.address || '未提供'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(merchant.status) as any}>
                      {getStatusText(merchant.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMerchant(merchant);
                          setShowMerchantModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {merchant.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(merchant.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(merchant.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {language === 'zh' ? '没有找到商家' : 'ไม่พบผู้ขาย'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件' : 'ลองปรับเงื่อนไขการค้นหา'}
            </p>
          </div>
        )}
      </Card>

      {/* 商家详情模态框 */}
      {showMerchantModal && selectedMerchant && (
        <Modal
          isOpen={showMerchantModal}
          onClose={() => setShowMerchantModal(false)}
          title={language === 'zh' ? '商家详情' : 'รายละเอียดผู้ขาย'}
        >
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '基本信息' : 'ข้อมูลพื้นฐาน'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '用户名' : 'ชื่อผู้ใช้'}
                  </label>
                  <Input
                    type="text"
                    value={selectedMerchant.username}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '公司名称' : 'ชื่อบริษัท'}
                  </label>
                  <Input
                    type="text"
                    value={selectedMerchant.company_name || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '电子邮箱' : 'อีเมล'}
                </label>
                <Input
                  type="text"
                  value={selectedMerchant.email || ''}
                  disabled
                />
              </div>
            </div>

            {/* 联系信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '联系信息' : 'ข้อมูลติดต่อ'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '联系人' : 'ผู้ติดต่อ'}
                  </label>
                  <Input
                    type="text"
                    value={selectedMerchant.contact_person || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '联系电话' : 'เบอร์โทร'}
                  </label>
                  <Input
                    type="text"
                    value={selectedMerchant.phone || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '地址' : 'ที่อยู่'}
                </label>
                <Input
                  type="text"
                  value={selectedMerchant.address || ''}
                  disabled
                />
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
                    {language === 'zh' ? '当前状态' : 'สถานะปัจจุบัน'}
                  </label>
                  <Badge variant={getStatusColor(selectedMerchant.status) as any}>
                    {getStatusText(selectedMerchant.status)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '申请时间' : 'วันที่สมัคร'}
                  </label>
                  <Input
                    type="text"
                    value={new Date(selectedMerchant.createdAt).toLocaleString()}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            {selectedMerchant.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(selectedMerchant.id, 'rejected')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '拒绝' : 'ปฏิเสธ'}
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedMerchant.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '批准' : 'อนุมัติ'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminMerchants;