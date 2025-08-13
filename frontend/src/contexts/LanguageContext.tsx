import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译字典
const translations = {
  zh: {
    // 通用
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.submit': '提交',
    'common.back': '返回',
    'common.next': '下一步',
    'common.previous': '上一步',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.reset': '重置',
    'common.view': '查看',
    'common.download': '下载',
    'common.upload': '上传',
    
    // 导航
    'nav.home': '首页',
    'nav.products': '产品',
    'nav.orders': '订单',
    'nav.profile': '个人中心',
    'nav.login': '登录',
    'nav.register': '注册',
    'nav.logout': '退出',
    'nav.dashboard': '控制台',
    
    // 认证
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.username': '用户名',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.phone': '电话',
    'auth.company': '公司名称',
    'auth.contact_person': '联系人',
    'auth.role.customer': '普通用户',
    'auth.role.merchant': '商家',
    'auth.role.agent': '代理',
    'auth.role.admin': '管理员',
    
    // 产品
    'product.title': '产品标题',
    'product.description': '产品描述',
    'product.price': '价格',
    'product.base_price': '基础价格',
    'product.poster': '海报图片',
    'product.pdf': 'PDF文件',
    'product.status.draft': '草稿',
    'product.status.pending': '待审核',
    'product.status.approved': '已通过',
    'product.status.rejected': '已拒绝',
    'product.create': '创建产品',
    'product.edit': '编辑产品',
    'product.submit_review': '提交审核',
    
    // 价格日历
    'schedule.date': '日期',
    'schedule.price': '价格',
    'schedule.stock': '库存',
    'schedule.available': '可用',
    'schedule.sold_out': '售罄',
    'schedule.set_price': '设置价格',
    'schedule.batch_set': '批量设置',
    
    // 订单
    'order.number': '订单号',
    'order.product': '产品',
    'order.date': '出行日期',
    'order.customer': '客户',
    'order.adults': '成人',
    'order.children_no_bed': '不占床儿童',
    'order.children_with_bed': '占床儿童',
    'order.infants': '婴儿',
    'order.total_people': '总人数',
    'order.total_price': '总价格',
    'order.status.pending': '待处理',
    'order.status.confirmed': '已确认',
    'order.status.rejected': '已拒绝',
    'order.status.archived': '已存档',
    'order.status.returned': '已回传',
    'order.create': '创建订单',
    'order.payment_screenshot': '付款截图',
    'order.return_pdf': '返回PDF',
    
    // 用户状态
    'user.status.pending': '待审核',
    'user.status.approved': '已通过',
    'user.status.rejected': '已拒绝',
    'user.status.suspended': '已暂停',
    
    // 文件上传
    'upload.drag_drop': '点击选择文件或拖拽到此处',
    'upload.image_only': '仅支持图片文件',
    'upload.pdf_only': '仅支持PDF文件',
    'upload.max_size': '最大文件大小',
    'upload.uploading': '上传中...',
    'upload.success': '上传成功',
    'upload.error': '上传失败',
    
    // 库存显示
    'stock.abundant': '库存充足',
    'stock.limited': '库存紧张',
    'stock.sold_out': '已售罄',
    'stock.not_available': '未开放',
  },
  th: {
    // 通用
    'common.loading': 'กำลังโหลด...',
    'common.error': 'ข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.confirm': 'ยืนยัน',
    'common.cancel': 'ยกเลิก',
    'common.save': 'บันทึก',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.submit': 'ส่ง',
    'common.back': 'กลับ',
    'common.next': 'ถัดไป',
    'common.previous': 'ก่อนหน้า',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.reset': 'รีเซ็ต',
    'common.view': 'ดู',
    'common.download': 'ดาวน์โหลด',
    'common.upload': 'อัปโหลด',
    
    // 导航
    'nav.home': 'หน้าแรก',
    'nav.products': 'สินค้า',
    'nav.orders': 'คำสั่งซื้อ',
    'nav.profile': 'โปรไฟล์',
    'nav.login': 'เข้าสู่ระบบ',
    'nav.register': 'สมัครสมาชิก',
    'nav.logout': 'ออกจากระบบ',
    'nav.dashboard': 'แดชบอร์ด',
    
    // 认证
    'auth.login': 'เข้าสู่ระบบ',
    'auth.register': 'สมัครสมาชิก',
    'auth.username': 'ชื่อผู้ใช้',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.phone': 'โทรศัพท์',
    'auth.company': 'ชื่อบริษัท',
    'auth.contact_person': 'ผู้ติดต่อ',
    'auth.role.customer': 'ลูกค้า',
    'auth.role.merchant': 'ผู้ขาย',
    'auth.role.agent': 'ตัวแทน',
    'auth.role.admin': 'ผู้ดูแลระบบ',
    
    // 产品
    'product.title': 'ชื่อสินค้า',
    'product.description': 'รายละเอียดสินค้า',
    'product.price': 'ราคา',
    'product.base_price': 'ราคาพื้นฐาน',
    'product.poster': 'รูปโปสเตอร์',
    'product.pdf': 'ไฟล์ PDF',
    'product.status.draft': 'ร่าง',
    'product.status.pending': 'รอการอนุมัติ',
    'product.status.approved': 'อนุมัติแล้ว',
    'product.status.rejected': 'ถูกปฏิเสธ',
    'product.create': 'สร้างสินค้า',
    'product.edit': 'แก้ไขสินค้า',
    'product.submit_review': 'ส่งเพื่อตรวจสอบ',
    
    // 价格日历
    'schedule.date': 'วันที่',
    'schedule.price': 'ราคา',
    'schedule.stock': 'สต็อก',
    'schedule.available': 'ว่าง',
    'schedule.sold_out': 'หมด',
    'schedule.set_price': 'ตั้งราคา',
    'schedule.batch_set': 'ตั้งแบบกลุ่ม',
    
    // 订单
    'order.number': 'หมายเลขคำสั่งซื้อ',
    'order.product': 'สินค้า',
    'order.date': 'วันที่เดินทาง',
    'order.customer': 'ลูกค้า',
    'order.adults': 'ผู้ใหญ่',
    'order.children_no_bed': 'เด็กไม่เสริมเตียง',
    'order.children_with_bed': 'เด็กเสริมเตียง',
    'order.infants': 'ทารก',
    'order.total_people': 'จำนวนคนทั้งหมด',
    'order.total_price': 'ราคารวม',
    'order.status.pending': 'รอดำเนินการ',
    'order.status.confirmed': 'ยืนยันแล้ว',
    'order.status.rejected': 'ถูกปฏิเสธ',
    'order.status.archived': 'เก็บถาวร',
    'order.status.returned': 'ส่งคืนแล้ว',
    'order.create': 'สร้างคำสั่งซื้อ',
    'order.payment_screenshot': 'หลักฐานการชำระเงิน',
    'order.return_pdf': 'ไฟล์ PDF ส่งคืน',
    
    // 用户状态
    'user.status.pending': 'รอการอนุมัติ',
    'user.status.approved': 'อนุมัติแล้ว',
    'user.status.rejected': 'ถูกปฏิเสธ',
    'user.status.suspended': 'ถูกระงับ',
    
    // 文件上传
    'upload.drag_drop': 'คลิกเลือกไฟล์หรือลากมาวางที่นี่',
    'upload.image_only': 'รองรับเฉพาะไฟล์รูปภาพ',
    'upload.pdf_only': 'รองรับเฉพาะไฟล์ PDF',
    'upload.max_size': 'ขนาดไฟล์สูงสุด',
    'upload.uploading': 'กำลังอัปโหลด...',
    'upload.success': 'อัปโหลดสำเร็จ',
    'upload.error': 'อัปโหลดล้มเหลว',
    
    // 库存显示
    'stock.abundant': 'สต็อกเพียงพอ',
    'stock.limited': 'สต็อกจำกัด',
    'stock.sold_out': 'หมดแล้ว',
    'stock.not_available': 'ไม่เปิดให้บริการ',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('zh');

  // 初始化语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['zh', 'th'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // 设置语言
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // 翻译函数
  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    return translation || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage必须在LanguageProvider内部使用');
  }
  return context;
};

export default LanguageContext;