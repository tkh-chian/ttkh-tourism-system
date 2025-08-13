import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { 
  ShoppingBag, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  product_number?: string;
  merchant_id: string;
  title_zh: string;
  title_th?: string;
  description_zh?: string;
  description_th?: string;
  base_price: number;
  poster_image?: string;
  poster_filename?: string;
  pdf_file?: string;
  pdf_filename?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  view_count: number;
  order_count: number;
  created_at: string;
  updated_at: string;
  merchant_name?: string;
  merchant?: {
    id: string;
    username: string;
    company_name?: string;
    contact_person?: string;
  };
}

const AdminProducts: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);


  useEffect(() => {

    filterProducts();
  }, [products, searchTerm, selectedStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 管理员产品API响应:', data);
        
        // 修复：正确处理后端返回的数据结构
        let productsData = [];
        
        if (data.success && data.data) {
          // 新格式: { success: true, data: { products: [...] } }
          if (data.data.products && Array.isArray(data.data.products)) {
            productsData = data.data.products;
          }
          // 或者直接是数组: { success: true, data: [...] }
          else if (Array.isArray(data.data)) {
            productsData = data.data;
          }
        }
        // 兼容旧格式
        else if (Array.isArray(data.products)) {
          productsData = data.products;
        }
        else if (Array.isArray(data)) {
          productsData = data;
        }
        
        console.log('✅ 处理后的产品数据:', {
          count: productsData.length,
          firstProduct: productsData[0] ? {
            id: productsData[0].id,
            title: productsData[0].title_zh,
            status: productsData[0].status
          } : null
        });
        
        setProducts(productsData);
      } else {
        console.error('❌ 获取产品列表失败:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('错误详情:', errorData);
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ 获取产品列表失败:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title_zh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.title_th && product.title_th.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.merchant_name && product.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    setFilteredProducts(filtered);
  };

  const handleStatusChange = async (productId: string, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/products/${productId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        const result = await response.json();
        alert(language === 'zh' ? result.message || '状态更新成功' : 'อัปเดตสถานะสำเร็จ');
        await fetchProducts();
        setShowProductModal(false);
      } else {
        const errorData = await response.json();
        alert(language === 'zh' ? errorData.message || '更新失败' : 'การอัปเดตล้มเหลว');
      }
    } catch (error) {
      console.error('更新产品状态失败:', error);
      alert(language === 'zh' ? '更新失败' : 'การอัปเดตล้มเหลว');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(language === 'zh' ? '确定要删除这个产品吗？' : 'คุณแน่ใจหรือไม่ที่จะลบผลิตภัณฑ์นี้?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          alert(language === 'zh' ? result.message || '产品删除成功' : 'ลบผลิตภัณฑ์สำเร็จ');
          await fetchProducts();
        } else {
          const errorData = await response.json();
          alert(language === 'zh' ? errorData.message || '删除失败' : 'การลบล้มเหลว');
        }
      } catch (error) {
        console.error('删除产品失败:', error);
        alert(language === 'zh' ? '删除失败' : 'การลบล้มเหลว');
      }
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'draft': language === 'zh' ? '草稿' : 'ร่าง',
      'pending': language === 'zh' ? '待审核' : 'รอการอนุมัติ',
      'approved': language === 'zh' ? '已批准' : 'อนุมัติแล้ว',
      'rejected': language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'draft': 'secondary',
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
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
          <ShoppingBag className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'zh' ? '产品管理' : 'จัดการผลิตภัณฑ์'}
            </h1>
            <p className="mt-2 text-gray-600">
              {language === 'zh' ? '审核和管理平台产品' : 'อนุมัติและจัดการผลิตภัณฑ์ในแพลตฟอร์ม'}
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {language === 'zh' ? '草稿' : 'ร่าง'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => p.status === 'draft').length}
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
                {language === 'zh' ? '待审核' : 'รอการอนุมัติ'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => p.status === 'pending').length}
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
                {products.filter(p => p.status === 'approved').length}
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
                {products.filter(p => p.status === 'rejected').length}
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
                {language === 'zh' ? '总数' : 'ทั้งหมด'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.length}
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
              placeholder={language === 'zh' ? '搜索产品名称或商家' : 'ค้นหาชื่อผลิตภัณฑ์หรือผู้ขาย'}
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
            <option value="draft">{language === 'zh' ? '草稿' : 'ร่าง'}</option>
            <option value="pending">{language === 'zh' ? '待审核' : 'รอการอนุมัติ'}</option>
            <option value="approved">{language === 'zh' ? '已批准' : 'อนุมัติแล้ว'}</option>
            <option value="rejected">{language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว'}</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {language === 'zh' ? `共 ${filteredProducts.length} 个产品` : `ทั้งหมด ${filteredProducts.length} ผลิตภัณฑ์`}
          </div>
        </div>
      </Card>

      {/* 产品列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '产品编号' : 'รหัสผลิตภัณฑ์'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '产品信息' : 'ข้อมูลผลิตภัณฑ์'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '商家' : 'ผู้ขาย'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '价格' : 'ราคา'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '统计' : 'สถิติ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '状态' : 'สถานะ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '操作' : 'การดำเนินการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.product_number || product.id?.substring(0, 8) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        {product.poster_image ? (
                          <img
                            className="h-16 w-16 rounded-lg object-cover"
                            src={product.poster_image}
                            alt={product.title_zh}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.title_zh}
                        </div>
                        {product.title_th && (
                          <div className="text-sm text-gray-500">
                            {product.title_th}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description_zh}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.merchant?.company_name || product.merchant?.username || product.merchant_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ¥{product.base_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{language === 'zh' ? '浏览' : 'ดู'}: {product.view_count || 0}</div>
                      <div>{language === 'zh' ? '订单' : 'คำสั่งซื้อ'}: {product.order_count || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(product.status) as any}>
                      {getStatusText(product.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(product.status === 'pending' || product.status === 'draft') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(product.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(product.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {language === 'zh' ? '没有找到产品' : 'ไม่พบผลิตภัณฑ์'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件' : 'ลองปรับเงื่อนไขการค้นหา'}
            </p>
          </div>
        )}
      </Card>

      {/* 产品详情模态框 */}
      {showProductModal && selectedProduct && (
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={language === 'zh' ? '产品详情' : 'รายละเอียดผลิตภัณฑ์'}
        >
          <div className="space-y-6">
            {/* 产品图片 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '产品图片' : 'รูปภาพผลิตภัณฑ์'}
              </h3>
              {selectedProduct.poster_image ? (
                <img
                  src={selectedProduct.poster_image}
                  alt={selectedProduct.title_zh}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '基本信息' : 'ข้อมูลพื้นฐาน'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '产品名称（中文）' : 'ชื่อผลิตภัณฑ์ (จีน)'}
                  </label>
                  <Input
                    type="text"
                    value={selectedProduct.title_zh}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '产品名称（泰文）' : 'ชื่อผลิตภัณฑ์ (ไทย)'}
                  </label>
                  <Input
                    type="text"
                    value={selectedProduct.title_th || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '产品描述' : 'คำอธิบายผลิตภัณฑ์'}
                </label>
                <textarea
                  value={selectedProduct.description_zh || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  rows={3}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '基础价格' : 'ราคาพื้นฐาน'}
                </label>
                <Input
                  type="text"
                  value={`¥${selectedProduct.base_price}`}
                  disabled
                />
              </div>
            </div>

            {/* 统计信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'zh' ? '统计信息' : 'ข้อมูลสถิติ'}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '浏览次数' : 'จำนวนการดู'}
                  </label>
                  <Input
                    type="text"
                    value={selectedProduct.view_count.toString()}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '订单数量' : 'จำนวนคำสั่งซื้อ'}
                  </label>
                  <Input
                    type="text"
                    value={(selectedProduct.order_count || 0).toString()}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '当前状态' : 'สถานะปัจจุบัน'}
                  </label>
                  <Badge variant={getStatusColor(selectedProduct.status) as any}>
                    {getStatusText(selectedProduct.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            {(selectedProduct.status === 'pending' || selectedProduct.status === 'draft') && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(selectedProduct.id, 'rejected')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '拒绝' : 'ปฏิเสธ'}
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedProduct.id, 'approved')}
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

export default AdminProducts;