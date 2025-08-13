import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { api } from '../services/api';

interface PriceSchedule {
  id: string;
  travel_date: string;
  price: number;
  total_stock: number;
  available_stock: number;
  date?: string; // 添加可选的date字段，兼容后端返回
}

interface PriceCalendarProps {
  productId: string;
  compact?: boolean;
  onDateSelect?: (date: Date, schedule?: PriceSchedule) => void;
  selectedDate?: Date;
}

export const PriceCalendar: React.FC<PriceCalendarProps> = ({
  productId,
  compact = false,
  onDateSelect,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<PriceSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = React.useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/products/${productId}/schedules`);
      if (response.data.success && response.data.data) {
        const schedulesData = response.data.data.schedules || [];
        console.log('获取到的价格日历数据:', schedulesData);
        setSchedules(schedulesData);
      }
    } catch (error) {
      console.error('获取价格日历失败:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const getScheduleForDate = (date: Date) => {
    const targetDate = format(date, 'yyyy-MM-dd');
    
    // 调试日志
    console.log(`查找日期 ${targetDate} 的价格日历，共有 ${schedules.length} 条记录`);
    
    const schedule = schedules.find(s => {
      // 处理后端返回的日期格式，可能包含时间部分
      const scheduleDate = s.travel_date ? s.travel_date.split('T')[0] : null;
      
      // 调试日志
      if (scheduleDate === targetDate) {
        console.log(`找到匹配的日期: ${targetDate}, 价格: ${s.price}, 库存: ${s.available_stock || s.total_stock}`);
      }
      
      return scheduleDate === targetDate;
    });
    
    return schedule;
  };

  const getStockDisplay = (stock: number | undefined) => {
    if (stock === undefined) return '未知';
    if (stock === 0) return '售罄';
    if (stock > 9) return '>9';
    return stock.toString();
  };

  const getStockStatus = (stock: number | undefined) => {
    if (stock === undefined) return 'unavailable';
    if (stock === 0) return 'sold-out';
    if (stock <= 9) return 'limited';
    return 'abundant';
  };

  const statusColors = {
    abundant: 'border-green-500 bg-green-50 text-green-800',
    limited: 'border-yellow-500 bg-yellow-50 text-yellow-800',
    'sold-out': 'border-red-500 bg-red-50 text-red-800',
    unavailable: 'border-gray-300 bg-gray-50 text-gray-500'
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 补充月初和月末的空白日期
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return; // 不能选择过去的日期
    if (!isSameMonth(date, currentMonth)) return; // 不能选择其他月份的日期
    
    const schedule = getScheduleForDate(date);
    if (schedule && (schedule.available_stock > 0 || schedule.total_stock > 0)) {
      // 确保日期格式正确，避免时区问题
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      console.log('选择的日期:', normalizedDate.toISOString().substring(0, 10));
      onDateSelect?.(normalizedDate, schedule);
    }
  };

  const renderDay = (date: Date) => {
    const schedule = getScheduleForDate(date);
    const isPast = isBefore(date, startOfDay(new Date()));
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    
    if (!isCurrentMonth) {
      return (
        <div key={date.toISOString()} className="p-2 text-gray-300">
          <div className="text-sm">{format(date, 'd')}</div>
        </div>
      );
    }

    if (isPast) {
      return (
        <div key={date.toISOString()} className="p-2 text-gray-400 bg-gray-100">
          <div className="text-sm">{format(date, 'd')}</div>
          <div className="text-xs">已过期</div>
        </div>
      );
    }

    if (!schedule) {
      return (
        <div key={date.toISOString()} className="p-2 text-gray-500">
          <div className="text-sm">{format(date, 'd')}</div>
          <div className="text-xs">未开放</div>
        </div>
      );
    }

    // 使用available_stock如果存在，否则使用total_stock
    const stock = schedule.available_stock !== undefined ? schedule.available_stock : schedule.total_stock;
    const stockStatus = getStockStatus(stock);
    const canSelect = stock > 0;

    return (
      <div
        key={date.toISOString()}
        className={`p-2 border-2 rounded cursor-pointer transition-all hover:shadow-md ${
          statusColors[stockStatus]
        } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
          !canSelect ? 'cursor-not-allowed opacity-60' : ''
        }`}
        onClick={() => canSelect && handleDateClick(date)}
      >
        <div className="text-sm font-bold flex items-center justify-between">
          <span>{format(date, 'd')}</span>
          {isToday(date) && <span className="text-xs bg-blue-500 text-white px-1 rounded">今</span>}
        </div>
        <div className="text-xs text-blue-600 font-medium">
          ¥{schedule.price}
        </div>
        <div className="text-xs">
          余{getStockDisplay(stock)}
        </div>
      </div>
    );
  };

  if (compact) {
    // 紧凑模式：只显示最近30天
    const next30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">近期价格</h4>
        <div className="grid grid-cols-5 gap-1 text-xs">
          {next30Days.slice(0, 10).map(date => {
            const schedule = getScheduleForDate(date);
            if (!schedule) return null;
            
            // 使用available_stock如果存在，否则使用total_stock
            const stock = schedule.available_stock !== undefined ? schedule.available_stock : schedule.total_stock;
            const stockStatus = getStockStatus(stock);
            
            return (
              <div
                key={date.toISOString()}
                className={`p-1 border rounded text-center ${statusColors[stockStatus]}`}
              >
                <div className="font-bold">{format(date, 'M/d')}</div>
                <div className="text-blue-600">¥{schedule.price}</div>
                <div>余{getStockDisplay(stock)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded-full"
          disabled={loading}
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded-full"
          disabled={loading}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="p-2 h-16 bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {allDays.map(renderDay)}
        </div>
      )}

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-green-500 bg-green-50 rounded"></div>
          <span>库存充足</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
          <span>库存紧张</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-red-500 bg-red-50 rounded"></div>
          <span>已售罄</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-gray-300 bg-gray-50 rounded"></div>
          <span>未开放</span>
        </div>
      </div>
    </div>
  );
};