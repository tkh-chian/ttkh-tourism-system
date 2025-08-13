import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { FileUpload } from '../../components/UI/FileUpload';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';
// import { productAPI } from '../../services/api';

interface ProductFormData {
  title_zh: string;
  title_th: string;
  description_zh: string;
  description_th: string;
  base_price: number;
  poster_image?: string;
  poster_filename?: string;
  pdf_file?: string;
  pdf_filename?: string;
}

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title_zh: '',
    title_th: '',
    description_zh: '',
    description_th: '',
    base_price: 0
  });

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (type: 'poster' | 'pdf') => (files: any[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (type === 'poster') {
        setFormData(prev => ({
          ...prev,
          poster_image: file.data,
          poster_filename: file.filename
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          pdf_file: file.data,
          pdf_filename: file.filename
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_zh || !formData.title_th || !formData.description_zh || !formData.description_th) {
      alert('请填写所有必填字段');
      return;
    }

    if (formData.base_price <= 0) {
      alert('请输入有效的价格');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('产品创建成功！');
        // 延迟导航，避免与文件上传对话框冲突
        setTimeout(() => {
          navigate('/merchant/products');
        }, 100);
      } else {
        const error = await response.json();
        alert(error.message || '创建失败');
      }
    } catch (error) {
      console.error('创建产品失败:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/merchant/products')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回' : 'กลับ'}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'zh' ? '创建新产品' : 'สร้างผลิตภัณฑ์ใหม่'}
          </h1>
        </div>
        <p className="text-gray-600">
          {language === 'zh' 
            ? '填写产品信息，创建您的旅游产品' 
            : 'กรอกข้อมูลผลิตภัณฑ์เพื่อสร้างผลิตภัณฑ์ท่องเที่ยวของคุณ'
          }
        </p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {language === 'zh' ? '基本信息' : 'ข้อมูลพื้นฐาน'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label={language === 'zh' ? '中文标题 *' : 'ชื่อภาษาจีน *'}
                type="text"
                value={formData.title_zh}
                onChange={(e) => handleInputChange('title_zh', e.target.value)}
                placeholder={language === 'zh' ? '格式: 产品中文名称 (如: 泰国曼谷三日游)' : 'รูปแบบ: ชื่อผลิตภัณฑ์ภาษาจีน (เช่น: ทัวร์กรุงเทพ 3 วัน)'}
                required
              />
            </div>
            
            <div>
              <Input
                label={language === 'zh' ? '泰文标题 *' : 'ชื่อภาษาไทย *'}
                type="text"
                value={formData.title_th}
                onChange={(e) => handleInputChange('title_th', e.target.value)}
                placeholder={language === 'zh' ? '请输入泰文标题' : 'กรุณาใส่ชื่อภาษาไทย'}
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <Input
              label={language === 'zh' ? '基础价格 (¥) *' : 'ราคาพื้นฐาน (¥) *'}
              type="number"
              value={formData.base_price}
              onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
              placeholder={language === 'zh' ? '格式: 数字价格 (如: 1999.00)' : 'รูปแบบ: ราคาตัวเลข (เช่น: 1999.00)'}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* 详细描述 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {language === 'zh' ? '详细描述' : 'รายละเอียด'}
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '中文描述 *' : 'รายละเอียดภาษาจีน *'}
              </label>
              <textarea
                value={formData.description_zh}
                onChange={(e) => handleInputChange('description_zh', e.target.value)}
                placeholder={language === 'zh' ? '格式: 详细产品描述，包含行程安排、景点介绍、服务内容等 (如: 第一天：抵达曼谷，入住酒店...)' : 'รูปแบบ: รายละเอียดผลิตภัณฑ์ รวมกำหนดการ สถานที่ท่องเที่ยว บริการ (เช่น: วันที่ 1: มาถึงกรุงเทพ เช็คอินโรงแรม...)'}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '泰文描述 *' : 'รายละเอียดภาษาไทย *'}
              </label>
              <textarea
                value={formData.description_th}
                onChange={(e) => handleInputChange('description_th', e.target.value)}
                placeholder={language === 'zh' ? '格式: 详细产品泰文描述，包含行程安排、景点介绍、服务内容等 (如: วันที่ 1: มาถึงกรุงเทพ เช็คอินโรงแรม...)' : 'รูปแบบ: รายละเอียดผลิตภัณฑ์ภาษาไทย รวมกำหนดการ สถานที่ท่องเที่ยว บริการ (เช่น: วันที่ 1: มาถึงกรุงเทพ เช็คอินโรงแรม...)'}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* 文件上传 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {language === 'zh' ? '文件上传' : 'อัปโหลดไฟล์'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '产品海报图片' : 'รูปโปสเตอร์ผลิตภัณฑ์'}
              </label>
              <FileUpload
                accept="image/*"
                onUpload={handleFileUpload('poster')}
                maxSize={5 * 1024 * 1024} // 5MB
                className="h-32"
              />
              {formData.poster_filename && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {formData.poster_filename}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '产品详情PDF' : 'PDF รายละเอียดผลิตภัณฑ์'}
              </label>
              <FileUpload
                accept=".pdf"
                onUpload={handleFileUpload('pdf')}
                maxSize={10 * 1024 * 1024} // 10MB
                className="h-32"
              />
              {formData.pdf_filename && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {formData.pdf_filename}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/merchant/products')}
            disabled={loading}
          >
            {language === 'zh' ? '取消' : 'ยกเลิก'}
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {language === 'zh' ? '创建产品' : 'สร้างผลิตภัณฑ์'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
export { CreateProduct };