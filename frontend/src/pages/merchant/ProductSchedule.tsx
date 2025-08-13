import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Calendar, Save, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

interface Schedule {
  id: string;
  product_id: string;
  travel_date: string;
  price: number;
  total_stock: number;
  available_stock: number;
}

interface Product {
  id: string;
  title_zh: string;
  title_th: string;
  base_price: number;
}

const ProductSchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [priceInput, setPriceInput] = useState<string>('');
  const [stockInput, setStockInput] = useState<string>('');
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (id) {
      fetchProductAndSchedules();
    }
  }, [id]);

  const fetchProductAndSchedules = async () => {
    try {
      setLoading(true);
      
      // 获取产品信息
      const productResponse = await fetch(`http://localhost:3001/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (productResponse.ok) {
        const productData = await productResponse.json();
        setProduct(productData.data);
      }

      // 获取价格日历
      const scheduleResponse = await fetch(`http://localhost:3001/api/products/${id}/schedules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        setSchedules(scheduleData.data.schedules || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      navigate('/merchant/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string, event?: React.MouseEvent) => {
    const isCtrlPressed = event?.ctrlKey || event?.metaKey || batchMode;
    
    if (isCtrlPressed) {
      // 多选模式：按住Ctrl键或批量模式多选日期
      setSelectedDates(prev => {
        if (prev.includes(date)) {
          return prev.filter(d => d !== date);
        } else {
          return [...prev, date];
        }
      });
    } else {
      // 单选模式
      setSelectedDates([date]);
      const existingSchedule = schedules.find(s => s.travel_date.split('T')[0] === date);
      if (existingSchedule) {
        setPriceInput(existingSchedule.price.toString());
        setStockInput(existingSchedule.total_stock.toString());
      } else {
        setPriceInput(product?.base_price.toString() || '');
        setStockInput('20');
      }
    }
  };

  const handleSaveSchedule = async () => {
    if (selectedDates.length === 0 || !priceInput || !stockInput) {
      alert(language === 'zh' ? '请选择日期并填写完整信息' : 'กรุณาเลือกวันที่และกรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setSaving(true);
      const scheduleData = selectedDates.map(date => ({
        date: date,
        price: parseFloat(priceInput),
        stock: parseInt(stockInput)
      }));

      const response = await fetch(`http://localhost:3001/api/products/${id}/schedules/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ schedules: scheduleData })
      });

      if (response.ok) {
        alert(language === 'zh' ? '价格设置成功' : 'ตั้งราคาสำเร็จ');
        fetchProductAndSchedules(); // 重新获取数据
        setSelectedDates([]);
        setPriceInput('');
        setStockInput('');
      } else {
        alert(language === 'zh' ? '设置失败' : 'การตั้งค่าล้มเหลว');
      }
    } catch (error) {
      console.error('设置价格失败:', error);
      alert(language === 'zh' ? '设置失败' : 'การตั้งค่าล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (date: string) => {
    if (!window.confirm(language === 'zh' ? '确定要删除这个日期的价格设置吗？' : 'แน่ใจหรือไม่ที่จะลบการตั้งราคาของวันนี้?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/products/${id}/schedules/${date}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(language === 'zh' ? '删除成功' : 'ลบสำเร็จ');
        fetchProductAndSchedules();
      } else {
        console.error('删除失败:', result);
        alert(language === 'zh' ? `删除失败: ${result.message || '未知错误'}` : `การลบล้มเหลว: ${result.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('删除价格设置失败:', error);
      alert(language === 'zh' ? '删除失败: 网络错误' : 'การลบล้มเหลว: ข้อผิดพลาดเครือข่าย');
    }
  };

  const handleBatchDelete = async () => {
    const schedulesToDelete = schedules.filter(s => selectedDates.includes(s.travel_date.split('T')[0]));
    if (schedulesToDelete.length === 0) {
      alert(language === 'zh' ? '请选择要删除的日期' : 'กรุณาเลือกวันที่ที่จะลบ');
      return;
    }

    if (!window.confirm(language === 'zh' ? `确定要删除选中的 ${schedulesToDelete.length} 个日期的价格设置吗？` : `แน่ใจหรือไม่ที่จะลบการตั้งราคาของ ${schedulesToDelete.length} วัน?`)) {
      return;
    }

    try {
      for (const schedule of schedulesToDelete) {
        const dateStr = schedule.travel_date.split('T')[0];
        await fetch(`http://localhost:3001/api/products/${id}/schedules/${dateStr}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      alert(language === 'zh' ? '批量删除成功' : 'ลบเป็นกลุ่มสำเร็จ');
      fetchProductAndSchedules();
      setSelectedDates([]);
    } catch (error) {
      console.error('批量删除失败:', error);
      alert(language === 'zh' ? '批量删除失败' : 'การลบเป็นกลุ่มล้มเหลว');
    }
  };

  const generateCalendarDates = () => {
    const dates = [];
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 生成当前月份的所有日期
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      // 只显示今天及以后的日期
      if (date >= today) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    
    // 不能选择过去的月份
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (newMonth >= currentMonthStart) {
      setCurrentMonth(newMonth);
    }
  };

  const getScheduleForDate = (date: string) => {
    return schedules.find(s => {
      // 处理后端返回的日期格式，可能包含时间部分
      const scheduleDate = s.travel_date.split('T')[0]; // 只取日期部分
      return scheduleDate === date;
    });
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

  const calendarDates = generateCalendarDates();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {language === 'zh' ? '价格日历' : 'ปฏิทินราคา'}
          </h1>
          <p className="mt-2 text-gray-600">
            {language === 'zh' ? `${product.title_zh} - 设置每日价格和库存` : `${product.title_th} - ตั้งราคาและสต็อกรายวัน`}
          </p>
        </div>
      </div>

      {/* 批量操作控制 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={batchMode ? "primary" : "outline"}
              onClick={() => {
                setBatchMode(!batchMode);
                if (!batchMode) {
                  setSelectedDates([]);
                }
              }}
            >
              {batchMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              {language === 'zh' ? '批量选择模式' : 'โหมดเลือกหลายรายการ'}
            </Button>
            {selectedDates.length > 0 && (
              <span className="text-sm text-gray-600">
                {language === 'zh' ? `已选择 ${selectedDates.length} 个日期` : `เลือกแล้ว ${selectedDates.length} วัน`}
              </span>
            )}
          </div>
          {selectedDates.length > 0 && schedules.some(s => selectedDates.includes(s.travel_date.split('T')[0])) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'zh' ? '批量删除' : 'ลบเป็นกลุ่ม'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 日历区域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* 月份导航 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                <Calendar className="w-5 h-5 inline mr-2" />
                {language === 'zh' ? '选择日期' : 'เลือกวันที่'}
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-lg font-medium min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {batchMode && (
              <div className="mb-4 text-sm text-blue-600">
                {language === 'zh' ? '批量选择模式 - 点击多个日期' : 'โหมดเลือกหลายรายการ - คลิกหลายวัน'}
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map((date) => {
                const schedule = getScheduleForDate(date);
                const dateObj = new Date(date);
                const isSelected = selectedDates.includes(date);
                
                return (
                  <div
                    key={date}
                    onClick={(e) => handleDateSelect(date, e)}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-colors relative
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${schedule ? 'bg-green-50 border-green-200' : ''}
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {dateObj.getDate()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dateObj.toLocaleDateString('zh-CN', { month: 'short' })}
                    </div>
                    {schedule && (
                      <>
                        <div className="text-xs text-green-600 mt-1">
                          ¥{schedule.price}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchedule(date);
                          }}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          title={language === 'zh' ? '删除此日期设置' : 'ลบการตั้งค่าวันนี้'}
                        >
                          ×
                        </button>
                      </>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 left-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 价格设置区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {language === 'zh' ? '价格设置' : 'ตั้งราคา'}
            </h2>
            
            {selectedDates.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '选中日期' : 'วันที่เลือก'}
                  </label>
                  <div className="text-sm text-blue-600 max-h-20 overflow-y-auto">
                    {selectedDates.length === 1 ? (
                      <div className="font-semibold">
                        {new Date(selectedDates[0]).toLocaleDateString()}
                      </div>
                    ) : (
                      <div>
                        {language === 'zh' ? `${selectedDates.length} 个日期` : `${selectedDates.length} วัน`}
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedDates.slice(0, 3).map(date => 
                            new Date(date).toLocaleDateString()
                          ).join(', ')}
                          {selectedDates.length > 3 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '价格 (¥)' : 'ราคา (¥)'}
                  </label>
                  <Input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder={language === 'zh' ? '请输入价格' : 'กรุณาใส่ราคา'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '库存数量' : 'จำนวนสต็อก'}
                  </label>
                  <Input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder={language === 'zh' ? '请输入库存数量' : 'กรุณาใส่จำนวนสต็อก'}
                  />
                </div>

                <Button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {language === 'zh' ? 
                    (selectedDates.length > 1 ? '批量保存设置' : '保存设置') : 
                    (selectedDates.length > 1 ? 'บันทึกการตั้งค่าเป็นกลุ่ม' : 'บันทึกการตั้งค่า')
                  }
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{language === 'zh' ? '请选择一个或多个日期来设置价格' : 'กรุณาเลือกวันที่เพื่อตั้งราคา'}</p>
                <p className="text-xs mt-2">
                  {language === 'zh' ? '提示：按住Ctrl键可多选日期' : 'เคล็ดลับ: กด Ctrl ค้างไว้เพื่อเลือกหลายวัน'}
                </p>
              </div>
            )}
          </div>

          {/* 已设置的价格列表 */}
          {schedules.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'zh' ? '已设置价格' : 'ราคาที่ตั้งไว้'}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {schedules.slice(0, 10).map((schedule) => (
                  <div key={schedule.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="text-sm text-gray-600">
                      {new Date(schedule.travel_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{schedule.price} ({schedule.total_stock}库存)
                      </div>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.travel_date.split('T')[0])}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={language === 'zh' ? '删除' : 'ลบ'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSchedule;