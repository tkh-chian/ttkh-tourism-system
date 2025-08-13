import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ThaiCalendarProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  schedules?: any[];
  className?: string;
}

// 泰国佛历年转换函数
const toBuddhistYear = (gregorianYear: number): number => {
  return gregorianYear + 543;
};

// 泰国法定节假日数据
const thaiHolidays = {
  '2025': [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่', nameZh: '新年' },
    { date: '2025-02-12', name: 'วันตรุษจีน', nameZh: '春节' },
    { date: '2025-02-13', name: 'วันตรุษจีน', nameZh: '春节' },
    { date: '2025-02-14', name: 'วันตรุษจีน', nameZh: '春节' },
    { date: '2025-04-06', name: 'วันจักรี', nameZh: '却克里王朝纪念日' },
    { date: '2025-04-13', name: 'วันสงกรานต์', nameZh: '泼水节' },
    { date: '2025-04-14', name: 'วันสงกรานต์', nameZh: '泼水节' },
    { date: '2025-04-15', name: 'วันสงกรานต์', nameZh: '泼水节' },
    { date: '2025-05-01', name: 'วันแรงงานแห่งชาติ', nameZh: '劳动节' },
    { date: '2025-05-05', name: 'วันฉัตรมงคล', nameZh: '加冕日' },
    { date: '2025-05-12', name: 'วันวิสาขบูชา', nameZh: '卫塞节' },
    { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษา', nameZh: '国王生日' },
    { date: '2025-08-12', name: 'วันแม่แห่งชาติ', nameZh: '母亲节' },
    { date: '2025-10-13', name: 'วันคล้ายวันสวรรคต', nameZh: '先王忌日' },
    { date: '2025-10-23', name: 'วันปิยมหาราช', nameZh: '朱拉隆功大帝纪念日' },
    { date: '2025-12-05', name: 'วันพ่อแห่งชาติ', nameZh: '父亲节' },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ', nameZh: '宪法日' },
    { date: '2025-12-31', name: 'วันสิ้นปี', nameZh: '除夕' }
  ]
};

// 泰语月份名称
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// 泰语星期名称
const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const ThaiCalendar: React.FC<ThaiCalendarProps> = ({
  selectedDate,
  onDateSelect,
  schedules = [],
  className = ''
}) => {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 检查是否为泰国节假日
  const isThaiHoliday = (dateStr: string) => {
    const year = dateStr.split('-')[0];
    const holidays = thaiHolidays[year as keyof typeof thaiHolidays] || [];
    return holidays.find(holiday => holiday.date === dateStr);
  };

  // 生成日历
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split('T')[0];
        const schedule = schedules.find(s => {
          const scheduleDate = new Date(s.travel_date).toISOString().split('T')[0];
          return scheduleDate === dateStr;
        });
        const holiday = isThaiHoliday(dateStr);
        const isCurrentMonth = current.getMonth() === month;
        const isToday = current.toDateString() === new Date().toDateString();
        const isPast = current < new Date(new Date().toDateString());

        weekDays.push({
          date: new Date(current),
          dateStr,
          schedule,
          holiday,
          isCurrentMonth,
          isToday,
          isPast
        });

        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }

    return calendar;
  };

  const calendar = generateCalendar();

  // 处理月份导航
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // 获取库存状态
  const getStockStatus = (stock: number) => {
    if (stock > 10) return 'abundant';
    if (stock > 0) return 'limited';
    return 'sold-out';
  };

  // 获取库存显示文本
  const getStockDisplay = (stock: number) => {
    if (language === 'th') {
      if (stock > 9) return '>9';
      if (stock > 0) return `${stock}`;
      return 'หมด';
    } else {
      if (stock > 9) return '>9';
      if (stock > 0) return `${stock}`;
      return '满';
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const buddhistYear = toBuddhistYear(year);

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* 日历头部 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {language === 'zh' ? '选择出行日期' : 'เลือกวันที่เดินทาง'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-medium min-w-[120px] text-center">
            {language === 'th' 
              ? `${thaiMonths[month]} ${buddhistYear}`
              : `${year}年${month + 1}月`
            }
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 text-sm mb-2">
        {(language === 'th' ? thaiWeekdays : ['日', '一', '二', '三', '四', '五', '六']).map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1 text-sm">
        {calendar.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const stockStatus = day.schedule ? getStockStatus(day.schedule.available_stock) : 'sold-out';
            const stockDisplay = day.schedule ? getStockDisplay(day.schedule.available_stock) : '-';
            const isSelectable = day.schedule && day.schedule.available_stock > 0 && !day.isPast;
            const isSelected = selectedDate === day.dateStr;

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => isSelectable && onDateSelect && onDateSelect(day.dateStr)}
                className={`
                  p-2 text-center border cursor-pointer transition-colors min-h-[80px] relative
                  ${!day.isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                  ${day.isPast ? 'text-gray-400 cursor-not-allowed' : ''}
                  ${!day.schedule ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  ${day.schedule && stockStatus === 'abundant' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}
                  ${day.schedule && stockStatus === 'limited' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : ''}
                  ${day.schedule && stockStatus === 'sold-out' ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed' : ''}
                  ${isSelected ? 'ring-4 ring-blue-500 bg-blue-100 border-blue-400 shadow-lg transform scale-105' : ''}
                  ${day.isToday ? 'font-bold' : ''}
                  ${day.holiday ? 'bg-pink-50 border-pink-200' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <div className={`${day.holiday ? 'text-pink-600 font-bold' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* 节假日标识 */}
                  {day.holiday && (
                    <div className="text-xs text-pink-600 mt-1 leading-tight">
                      {language === 'th' ? day.holiday.name : day.holiday.nameZh}
                    </div>
                  )}
                  
                  {/* 价格和库存信息 */}
                  {day.schedule && (
                    <div className="mt-auto">
                      <div className="text-xs">¥{day.schedule.price}</div>
                      <div className="text-xs">{stockDisplay}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 选中日期信息 */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded">
          <div className="text-sm">
            <strong>
              {language === 'zh' ? '已选择日期：' : 'วันที่เลือก: '}
            </strong> 
            {selectedDate}
          </div>
          {schedules.find(s => s.travel_date === selectedDate) && (
            <div className="text-sm mt-1">
              <strong>
                {language === 'zh' ? '价格：' : 'ราคา: '}
              </strong> 
              ¥{schedules.find(s => s.travel_date === selectedDate)?.price}
            </div>
          )}
        </div>
      )}

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div>
          <span>{language === 'zh' ? '库存充足' : 'สต็อกเพียงพอ'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-1"></div>
          <span>{language === 'zh' ? '库存紧张' : 'สต็อกจำกัด'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-1"></div>
          <span>{language === 'zh' ? '已售罄' : 'หมดแล้ว'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-pink-100 border border-pink-200 rounded mr-1"></div>
          <span>{language === 'zh' ? '法定节假日' : 'วันหยุดราชการ'}</span>
        </div>
      </div>
    </div>
  );
};

export default ThaiCalendar;
export { ThaiCalendar };
