import React, { useState, useEffect } from 'react';
import { Button } from './UI/Button';
import { FileUpload } from './UI/FileUpload';
import { FileUploadResult } from '../types';
import { Modal } from './UI/Modal';
import { PriceCalendar } from './PriceCalendar';
import { Plus, Edit, Trash2, Eye, Calendar, Upload, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { productAPI } from '../services/api';

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
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  view_count: number;
  order_count: number;
  created_at: string;
}

interface ProductFormData {
  title_zh: string;
  title_th: string;
  description_zh: string;
  description_th: string;
  base_price: number;
  poster_image?: FileUploadResult;
  pdf_file?: FileUploadResult;
}

export const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCalendar, setShowCalendar] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title_zh: '',
    title_th: '',
    description_zh: '',
    description_th: '',
    base_price: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products/merchant', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setFormData({
      title_zh: '',
      title_th: '',
      description_zh: '',
      description_th: '',
      base_price: 0,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title_zh: product.title_zh,
      title_th: product.title_th,
      description_zh: product.description_zh,
      description_th: product.description_th,
      base_price: product.base_price,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title_zh.trim()) {
      errors.title_zh = '请输入中文标题';
    }

    if (!formData.title_th.trim()) {
      errors.title_th = '请输入泰文标题';
    }

    if (!formData.description_zh.trim()) {
      errors.description_zh = '请输入中文描述';
    }

    if (!formData.description_th.trim()) {
      errors.description_th = '请输入泰文描述';
    }

    if (formData.base_price <= 0) {
      errors.base_price = '请输入有效的基础价格';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        poster_image: formData.poster_image?.data,
        poster_filename: formData.poster_image?.filename,
        pdf_file: formData.pdf_file?.data,
        pdf_filename: formData.pdf_file?.filename,
      };

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        setShowForm(false);
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('确定要删除这个产品吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      alert('状态更新失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-600'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: '草稿',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      archived: '已存档'
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
        <Button onClick={handleCreateProduct}>
          <Plus className="w-4 h-4 mr-2" />
          创建产品
        </Button>
      </div>

      {/* 产品列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  产品信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数据
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.poster_image && (
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded object-cover"
                            src={product.poster_image}
                            alt={product.title_zh}
                          />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.title_zh}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.title_th}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ¥{product.base_price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {getStatusText(product.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>浏览: {product.view_count}</div>
                    <div>订单: {product.order_count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowCalendar(product.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    {product.pdf_file && (
                      <a
                        href={product.pdf_file}
                        download={product.pdf_filename}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无产品，点击"创建产品"开始添加</p>
          </div>
        )}
      </div>

      {/* 产品表单弹窗 */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingProduct ? '编辑产品' : '创建产品'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 中文标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              中文标题 *
            </label>
            <input
              type="text"
              value={formData.title_zh}
              onChange={(e) => setFormData(prev => ({ ...prev, title_zh: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入中文标题"
            />
            {formErrors.title_zh && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title_zh}</p>
            )}
          </div>

          {/* 泰文标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              泰文标题 *
            </label>
            <input
              type="text"
              value={formData.title_th}
              onChange={(e) => setFormData(prev => ({ ...prev, title_th: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入泰文标题"
            />
            {formErrors.title_th && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title_th}</p>
            )}
          </div>

          {/* 中文描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              中文描述 *
            </label>
            <textarea
              value={formData.description_zh}
              onChange={(e) => setFormData(prev => ({ ...prev, description_zh: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入中文描述"
            />
            {formErrors.description_zh && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description_zh}</p>
            )}
          </div>

          {/* 泰文描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              泰文描述 *
            </label>
            <textarea
              value={formData.description_th}
              onChange={(e) => setFormData(prev => ({ ...prev, description_th: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入泰文描述"
            />
            {formErrors.description_th && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description_th}</p>
            )}
          </div>

          {/* 基础价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              基础价格 *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入基础价格"
            />
            {formErrors.base_price && (
              <p className="mt-1 text-sm text-red-600">{formErrors.base_price}</p>
            )}
          </div>

          {/* 海报上传 */}
          <div>
            <FileUpload
              label="产品海报"
              helperText="支持 JPG、PNG、GIF 格式，最大 20MB"
              accept="image/*"
              maxSize={20 * 1024 * 1024}
              onUpload={(files) => setFormData(prev => ({ ...prev, poster_image: files[0] }))}
              onRemove={() => setFormData(prev => ({ ...prev, poster_image: undefined }))}
              files={formData.poster_image ? [formData.poster_image] : []}
            />
          </div>

          {/* PDF上传 */}
          <div>
            <FileUpload
              label="行程PDF"
              helperText="支持 PDF 格式，最大 50MB"
              accept=".pdf"
              maxSize={50 * 1024 * 1024}
              onUpload={(files) => setFormData(prev => ({ ...prev, pdf_file: files[0] }))}
              onRemove={() => setFormData(prev => ({ ...prev, pdf_file: undefined }))}
              files={formData.pdf_file ? [formData.pdf_file] : []}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="flex-1"
            >
              {editingProduct ? '更新产品' : '创建产品'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 价格日历弹窗 */}
      {showCalendar && (
        <Modal
          isOpen={true}
          onClose={() => setShowCalendar(null)}
          title="价格日历管理"
          size="xl"
        >
          <PriceCalendar
            productId={showCalendar}
            onDateSelect={(date, schedule) => {
              // 处理日期选择
              console.log('选择日期:', date, schedule);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
