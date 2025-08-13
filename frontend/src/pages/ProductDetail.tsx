import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { PriceCalendar } from '../components/PriceCalendar';
import { OrderForm, OrderFormData } from '../components/OrderForm';
import { api } from '../services/api';

interface Product {
  id: string;
  title_zh: string;
  title_th: string;
  description_zh: string;
  description_th: string;
  base_price: number;
  product_number: string;
  poster_image?: string;
  pdf_file?: string;
  status: string;
  view_count: number;
  order_count: number;
  created_at: string;
}

interface PriceSchedule {
  id: string;
  travel_date: string;
  price: number;
  total_stock: number;
  available_stock: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSchedule, setSelectedSchedule] = useState<PriceSchedule | undefined>();

  const fetchProductDetail = React.useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await api.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        setError('获取产品详情失败');
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
      setError('获取产品详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handleDateSelect = (date: Date, schedule?: PriceSchedule) => {
    setSelectedDate(date);
    setSelectedSchedule(schedule);
    setShowOrderForm(true);
  };

  const handleOrderSubmit = async (orderData: OrderFormData) => {
    try {
      console.log('📤 发送订单数据:', orderData);
      
      // 确保所有必填字段都有值，并且日期格式正确
      const travelDate = orderData.travel_date.includes('T') 
        ? orderData.travel_date.split('T')[0] 
        : orderData.travel_date;
        
      console.log('提交订单使用的日期:', travelDate);
      
      // 计算总价
      const price = selectedSchedule?.price || product?.base_price || 0;
      const totalPeople = orderData.adults + orderData.children_no_bed + orderData.children_with_bed;
      const totalPrice = price * totalPeople;
      
      const orderPayload = {
        product_id: id,
        travel_date: travelDate,
        adults: orderData.adults || 1,
        children_no_bed: orderData.children_no_bed || 0,
        children_with_bed: orderData.children_with_bed || 0,
        infants: orderData.infants || 0,
        customer_name: orderData.customer_name.trim(),
        customer_phone: orderData.customer_phone.trim(),
        customer_email: orderData.customer_email?.trim() || '',
        notes: orderData.notes?.trim() || '',
        total_price: totalPrice,
        unit_price: price
      };
      
      console.log('📤 最终订单载荷:', orderPayload);
      
      const response = await api.post('/orders', orderPayload);
      
      console.log('📥 订单创建响应:', response.data);
      
      if (response.data.success) {
        // 检查订单号的位置，可能在不同的嵌套层级
        const orderNumber = response.data.data.orderNumber || 
                           (response.data.data.order && response.data.data.order.order_number) || 
                           '已创建';
        alert('订单创建成功！订单号: ' + orderNumber);
        setShowOrderForm(false);
        // 刷新产品详情以更新订单数量
        fetchProductDetail();
      } else {
        throw new Error(response.data.message || '创建订单失败');
      }
    } catch (error: any) {
      console.error('创建订单失败:', error);
      
      // 显示更详细的错误信息
      let errorMessage = '创建订单失败，请重试';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || '产品不存在'}
          </h2>
          <Button onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const title = language === 'zh' ? product.title_zh : product.title_th;
  const description = language === 'zh' ? product.description_zh : product.description_th;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 产品信息 */}
        <div>
          <Card className="p-6">
            {product.poster_image && (
              <div className="mb-6">
                <img
                  src={product.poster_image.startsWith('data:') ? product.poster_image : `data:image/jpeg;base64,${product.poster_image}`}
                  alt={title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
<p className="text-gray-500 mb-4">产品编号: {product.product_number}</p>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <span>浏览量: {product.view_count}</span>
              <span>订单数: {product.order_count}</span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">产品描述</h3>
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
            
            <div className="mb-6">
              <span className="text-2xl font-bold text-blue-600">
                起价: ¥{product.base_price}
              </span>
            </div>
            
            {product.pdf_file && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = product.pdf_file && product.pdf_file.startsWith('data:') 
                      ? product.pdf_file 
                      : `data:application/pdf;base64,${product.pdf_file || ''}`;
                    link.download = '产品详情.pdf';
                    link.click();
                  }}
                  variant="outline"
                >
                  下载产品详情PDF
                </Button>
              </div>
            )}

            {product.poster_image && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:image/jpeg;base64,${product.poster_image}`;
                    link.download = '产品海报.jpg';
                    link.click();
                  }}
                  variant="outline"
                >
                  下载产品海报
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 价格日历 */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">选择出行日期</h2>
            <PriceCalendar
              productId={id!}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </Card>
        </div>
      </div>

      {/* 订单表单 */}
      {product && (
        <OrderForm
          product={product}
          selectedDate={selectedDate}
          selectedSchedule={selectedSchedule}
          onSubmit={handleOrderSubmit}
          onClose={() => setShowOrderForm(false)}
          isOpen={showOrderForm}
        />
      )}
    </div>
  );
};

export default ProductDetail;