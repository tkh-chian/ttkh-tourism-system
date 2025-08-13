import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Modal } from '../../components/UI/Modal';
import { Badge } from '../../components/UI/Badge';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Archive, ArchiveRestore } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { productAPI } from '../../services/api';

interface Product {
  id: string;
  title_zh: string;
  title_th: string;
  description_zh: string;
  description_th: string;
  base_price: number;
  poster_image?: string;
  poster_filename?: string;
  pdf_file?: string;
  pdf_filename?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'draft';
  view_count: number;
  order_count: number;
  created_at: string;
  updated_at: string;
}

const Products: React.FC = () => {
  // const { user } = useAuth();
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/products/merchant/my-products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 处理后端返回的数据结构: { success: true, data: { products: [...] } }
        const productsData = data.data?.products || data.products || data.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('获取产品列表失败');
        setProducts([]); // 确保在错误情况下也设置为空数组
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      setProducts([]); // 确保在异常情况下也设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        setDeleteModal({ isOpen: false, product: null });
        alert('产品删除成功');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除产品失败:', error);
      alert('删除失败');
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      // 根据当前状态决定API路径
      let apiPath: string;
      let newStatus: 'draft' | 'pending';
      
      if (currentStatus === 'approved') {
        apiPath = `http://localhost:3001/api/products/${productId}/unpublish`;
        newStatus = 'draft'; // 下架后变为草稿状态
      } else if (currentStatus === 'archived' || currentStatus === 'draft') {
        apiPath = `http://localhost:3001/api/products/${productId}/submit`;
        newStatus = 'pending'; // 重新上架，需要审核
      } else {
        return; // 其他状态不允许切换
      }

      console.log('调用API:', apiPath);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      console.log('响应状态:', response.status);
      console.log('响应头:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('成功响应:', result);
        
        // 更新本地状态
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: newStatus } : p
        ));
        
        const actionText = newStatus === 'draft' ? '下架' : '重新上架';
        alert(language === 'zh' ? `产品${actionText}成功` : `การ${actionText}ผลิตภัณฑ์สำเร็จ`);
      } else {
        const errorText = await response.text();
        console.error('错误响应:', errorText);
        console.error('响应状态:', response.status);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(language === 'zh' ? `操作失败: ${errorData.message || '未知错误'}` : `การดำเนินการล้มเหลว: ${errorData.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
        } catch {
          alert(language === 'zh' ? `服务器错误 (${response.status})` : `เกิดข้อผิดพลาดเซิร์ฟเวอร์ (${response.status})`);
        }
      }
    } catch (error) {
      console.error('切换产品状态失败:', error);
      alert(language === 'zh' ? '操作失败' : 'การดำเนินการล้มเหลว');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: '待审核', color: 'yellow' as const },
      approved: { text: '已通过', color: 'green' as const },
      rejected: { text: '已拒绝', color: 'red' as const },
      archived: { text: '已下架', color: 'secondary' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  const filteredProducts = products.filter(product => {
    const title = language === 'zh' ? product.title_zh : product.title_th;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'zh' ? '产品管理' : 'จัดการผลิตภัณฑ์'}
          </h1>
          <p className="mt-2 text-gray-600">
            {language === 'zh' ? '管理您的旅游产品' : 'จัดการผลิตภัณฑ์ท่องเที่ยวของคุณ'}
          </p>
        </div>
        <Link to="/merchant/products/create">
          <Button className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'zh' ? '添加产品' : 'เพิ่มผลิตภัณฑ์'}
          </Button>
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={language === 'zh' ? '搜索产品名称...' : 'ค้นหาชื่อผลิตภัณฑ์...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'zh' ? '全部状态' : 'ทุกสถานะ'}</option>
            <option value="pending">{language === 'zh' ? '待审核' : 'รอการอนุมัติ'}</option>
            <option value="approved">{language === 'zh' ? '已通过' : 'อนุมัติแล้ว'}</option>
            <option value="rejected">{language === 'zh' ? '已拒绝' : 'ถูกปฏิเสธ'}</option>
          </select>
        </div>
      </div>

      {/* 产品列表 */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {language === 'zh' ? '暂无产品' : 'ไม่มีผลิตภัณฑ์'}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === 'zh' ? '开始创建您的第一个旅游产品' : 'เริ่มสร้างผลิตภัณฑ์ท่องเที่ยวแรกของคุณ'}
          </p>
          <Link to="/merchant/products/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'zh' ? '创建产品' : 'สร้างผลิตภัณฑ์'}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '产品信息' : 'ข้อมูลผลิตภัณฑ์'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '价格' : 'ราคา'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '状态' : 'สถานะ'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '统计' : 'สถิติ'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '创建时间' : 'วันที่สร้าง'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '操作' : 'การดำเนินการ'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.poster_image && (
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.poster_image.startsWith('data:') ? product.poster_image : `data:image/jpeg;base64,${product.poster_image}`}
                              alt={language === 'zh' ? product.title_zh : product.title_th}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {language === 'zh' ? product.title_zh : product.title_th}
                          </div>
                          <div className="text-xs text-blue-600 font-medium mb-1">
                            {language === 'zh' ? `产品编号: #${product.id}` : `รหัสผลิตภัณฑ์: #${product.id}`}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {language === 'zh' ? product.description_zh : product.description_th}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{product.base_price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{language === 'zh' ? '浏览' : 'ดู'}: {product.view_count}</div>
                      <div>{language === 'zh' ? '订单' : 'คำสั่งซื้อ'}: {product.order_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/products/${product.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/merchant/products/${product.id}/schedule`, '_blank')}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Link to={`/merchant/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        {/* 下架/上架按钮 */}
                        {(product.status === 'approved' || product.status === 'archived') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleProductStatus(product.id, product.status)}
                            className={product.status === 'approved' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                            title={product.status === 'approved' ? 
                              (language === 'zh' ? '下架产品' : 'ปิดการขายผลิตภัณฑ์') : 
                              (language === 'zh' ? '重新上架' : 'เปิดการขายอีกครั้ง')
                            }
                          >
                            {product.status === 'approved' ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, product })}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        title={language === 'zh' ? '确认删除' : 'ยืนยันการลบ'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {language === 'zh' 
              ? `确定要删除产品 "${deleteModal.product ? deleteModal.product.title_zh : ''}" 吗？此操作不可撤销。`
              : `แน่ใจหรือไม่ที่จะลบผลิตภัณฑ์ "${deleteModal.product ? deleteModal.product.title_th : ''}"? การดำเนินการนี้ไม่สามารถยกเลิกได้`
            }
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, product: null })}
            >
              {language === 'zh' ? '取消' : 'ยกเลิก'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteModal.product && handleDeleteProduct(deleteModal.product.id)}
            >
              {language === 'zh' ? '删除' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
export { Products };