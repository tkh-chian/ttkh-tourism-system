import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 公司信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'zh' ? 'TTKH旅游管理系统' : 'TTKH ระบบจัดการท่องเที่ยว'}
            </h3>
            <p className="text-gray-300 text-sm">
              {language === 'zh' 
                ? '专业的泰国-中国旅游产品预订平台，为泰国游客提供优质的中国旅游体验。'
                : 'แพลตฟอร์มจองสินค้าท่องเที่ยวไทย-จีนระดับมืออาชีพ ให้บริการประสบการณ์ท่องเที่ยวจีนคุณภาพสูงสำหรับนักท่องเที่ยวไทย'
              }
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'zh' ? '快速链接' : 'ลิงก์ด่วน'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  {language === 'zh' ? '首页' : 'หน้าแรก'}
                </a>
              </li>
              <li>
                <a href="/products" className="text-gray-300 hover:text-white transition-colors">
                  {language === 'zh' ? '产品列表' : 'รายการสินค้า'}
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  {language === 'zh' ? '关于我们' : 'เกี่ยวกับเรา'}
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  {language === 'zh' ? '联系我们' : 'ติดต่อเรา'}
                </a>
              </li>
            </ul>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'zh' ? '联系信息' : 'ข้อมูลติดต่อ'}
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                {language === 'zh' ? '邮箱: ' : 'อีเมล: '}
                <a href="mailto:info@ttkh.com" className="hover:text-white transition-colors">
                  info@ttkh.com
                </a>
              </p>
              <p>
                {language === 'zh' ? '电话: ' : 'โทรศัพท์: '}
                <a href="tel:+66123456789" className="hover:text-white transition-colors">
                  +66 123 456 789
                </a>
              </p>
              <p>
                {language === 'zh' ? '微信: ' : 'WeChat: '}
                <span className="text-white">TTKH_Official</span>
              </p>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 TTKH {language === 'zh' ? '旅游管理系统' : 'ระบบจัดการท่องเที่ยว'}. 
            {language === 'zh' ? ' 保留所有权利。' : ' สงวนลิขสิทธิ์ทั้งหมด'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;