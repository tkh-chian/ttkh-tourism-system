import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { FileUpload } from '../../components/UI/FileUpload';
import { ArrowLeft, Save, Trash2, Upload, Image, FileText, AlertTriangle } from 'lucide-react';

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
  status?: string;
}

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [newPosterImage, setNewPosterImage] = useState<string | null>(null);
  const [newPosterFilename, setNewPosterFilename] = useState<string | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<string | null>(null);
  const [newPdfFilename, setNewPdfFilename] = useState<string | null>(null);
  const [deletePoster, setDeletePoster] = useState(false);
  const [deletePdf, setDeletePdf] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 处理不同的数据结构
        const productData = data.data.product || data.data;
        if (productData) {
          setProduct(productData);
        } else {
          console.error('产品数据格式不正确:', data);
          alert('获取产品详情失败，数据格式不正确');
          navigate('/merchant/products');
        }
      } else {
        console.error('获取产品详情失败');
        navigate('/merchant/products');
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
      navigate('/merchant/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      
      // 构建更新数据
      const updateData = {
        ...product,
        poster_image: newPosterImage || (deletePoster ? null : product.poster_image),
        poster_filename: newPosterFilename || (deletePoster ? null : product.poster_filename),
        pdf_file: newPdfFile || (deletePdf ? null : product.pdf_file),
        pdf_filename: newPdfFilename || (deletePdf ? null : product.pdf_filename),
        delete_poster: deletePoster,
        delete_pdf: deletePdf
      };

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(language === 'zh' ? result.message || '产品更新成功，状态已变为待审核' : 'อัปเดตผลิตภัณฑ์สำเร็จ สถานะเปลี่ยนเป็นรอการอนุมัติ');
        navigate('/merchant/products');
      } else {
        const errorData = await response.json();
        alert(language === 'zh' ? errorData.message || '更新失败' : 'การอัปเดตล้มเหลว');
      }
    } catch (error) {
      console.error('更新产品失败:', error);
      alert(language === 'zh' ? '更新失败' : 'การอัปเดตล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Product, value: string | number) => {
    if (product) {
      setProduct({ ...product, [field]: value });
    }
  };


  const handlePosterUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setNewPosterImage(result);
      setNewPosterFilename(file.name);
      setDeletePoster(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setNewPdfFile(result);
      setNewPdfFilename(file.name);
      setDeletePdf(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePoster = () => {
    setDeletePoster(true);
    setNewPosterImage(null);
    setNewPosterFilename(null);
  };

  const handleDeletePdf = () => {
    setDeletePdf(true);
    setNewPdfFile(null);
    setNewPdfFilename(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'zh' ? '产品不存在' : 'ไม่พบผลิตภัณฑ์'}
          </h1>
          <Button onClick={() => navigate('/merchant/products')}>
            {language === 'zh' ? '返回产品列表' : 'กลับไปยังรายการผลิตภัณฑ์'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/merchant/products')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'zh' ? '返回' : 'กลับ'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'zh' ? '编辑产品' : 'แก้ไขผลิตภัณฑ์'}
          </h1>
          <p className="mt-2 text-gray-600">
            {language === 'zh' ? '修改产品信息' : 'แก้ไขข้อมูลผลิตภัณฑ์'}
          </p>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          {/* 重要提示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  {language === 'zh' ? '重要提示' : 'ข้อสำคัญ'}
                </h4>
                <p className="text-sm text-yellow-700">
                  {language === 'zh' 
                    ? '修改产品信息后，产品状态将变为"待审核"，需要管理员重新审核通过后才能上架销售。'
                    : 'หลังจากแก้ไขข้อมูลผลิตภัณฑ์ สถานะจะเปลี่ยนเป็น "รอการอนุมัติ" และต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถขายได้'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 中文标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '中文标题' : 'ชื่อภาษาจีน'}
            </label>
            <Input
              type="text"
              value={product.title_zh}
              onChange={(e) => handleInputChange('title_zh', e.target.value)}
              placeholder={language === 'zh' ? '请输入中文标题' : 'กรุณาใส่ชื่อภาษาจีน'}
            />
          </div>

          {/* 泰文标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '泰文标题' : 'ชื่อภาษาไทย'}
            </label>
            <Input
              type="text"
              value={product.title_th}
              onChange={(e) => handleInputChange('title_th', e.target.value)}
              placeholder={language === 'zh' ? '请输入泰文标题' : 'กรุณาใส่ชื่อภาษาไทย'}
            />
          </div>

          {/* 中文描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '中文描述' : 'คำอธิบายภาษาจีน'}
            </label>
            <textarea
              value={product.description_zh}
              onChange={(e) => handleInputChange('description_zh', e.target.value)}
              placeholder={language === 'zh' ? '请输入中文描述' : 'กรุณาใส่คำอธิบายภาษาจีน'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 泰文描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '泰文描述' : 'คำอธิบายภาษาไทย'}
            </label>
            <textarea
              value={product.description_th}
              onChange={(e) => handleInputChange('description_th', e.target.value)}
              placeholder={language === 'zh' ? '请输入泰文描述' : 'กรุณาใส่คำอธิบายภาษาไทย'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 基础价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '基础价格 (¥)' : 'ราคาพื้นฐาน (¥)'}
            </label>
            <Input
              type="number"
              value={product.base_price}
              onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
              placeholder={language === 'zh' ? '请输入基础价格' : 'กรุณาใส่ราคาพื้นฐาน'}
            />
          </div>

          {/* 产品海报管理 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? '产品海报' : 'โปสเตอร์ผลิตภัณฑ์'}
            </label>
            
            {/* 当前海报显示 */}
            {(product.poster_image && !deletePoster) || newPosterImage ? (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={newPosterImage || (product.poster_image?.startsWith('data:') ? product.poster_image : `data:image/jpeg;base64,${product.poster_image}`)}
                    alt="Product Poster"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={handleDeletePoster}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {newPosterFilename || product.poster_filename || (language === 'zh' ? '当前海报' : 'โปสเตอร์ปัจจุบัน')}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {language === 'zh' ? '暂无海报' : 'ไม่มีโปสเตอร์'}
                  </p>
                </div>
              </div>
            )}

            {/* 上传新海报 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePosterUpload(file);
                }}
                className="hidden"
                id="poster-upload"
              />
              <label
                htmlFor="poster-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {language === 'zh' ? '点击上传新海报' : 'คลิกเพื่ออัปโหลดโปสเตอร์ใหม่'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {language === 'zh' ? '支持 JPG, PNG 格式' : 'รองรับ JPG, PNG'}
                </span>
              </label>
            </div>
          </div>

          {/* PDF文件管理 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'zh' ? 'PDF文件' : 'ไฟล์ PDF'}
            </label>
            
            {/* 当前PDF显示 */}
            {(product.pdf_file && !deletePdf) || newPdfFile ? (
              <div className="mb-4">
                <div className="flex items-center p-3 border rounded-lg bg-gray-50">
                  <FileText className="w-6 h-6 text-blue-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {newPdfFilename || product.pdf_filename || (language === 'zh' ? '产品PDF文件' : 'ไฟล์ PDF ผลิตภัณฑ์')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'zh' ? 'PDF文档' : 'เอกสาร PDF'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeletePdf}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {language === 'zh' ? '暂无PDF文件' : 'ไม่มีไฟล์ PDF'}
                  </p>
                </div>
              </div>
            )}

            {/* 上传新PDF */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {language === 'zh' ? '点击上传新PDF文件' : 'คลิกเพื่ออัปโหลดไฟล์ PDF ใหม่'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {language === 'zh' ? '仅支持 PDF 格式' : 'รองรับเฉพาะ PDF'}
                </span>
              </label>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/merchant/products')}
              disabled={saving}
            >
              {language === 'zh' ? '取消' : 'ยกเลิก'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {language === 'zh' ? '保存修改' : 'บันทึกการแก้ไข'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;