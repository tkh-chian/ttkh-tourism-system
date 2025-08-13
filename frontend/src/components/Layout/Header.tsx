import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'th' : 'zh');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold text-primary-600">
                TTKH
              </div>
              <div className="ml-2 text-sm text-gray-600">
                {language === 'zh' ? '旅游管理系统' : 'ระบบจัดการท่องเที่ยว'}
              </div>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('nav.home')}
            </Link>
            
            {isAuthenticated && (
              <>
                {user?.role === 'merchant' && (
                  <Link
                    to="/merchant/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                
                {user?.role === 'agent' && (
                  <Link
                    to="/agent/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                
                {user?.role === 'customer' && (
                  <Link
                    to="/user/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.orders')}
                </Link>
              </>
            )}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* 语言切换按钮 */}
            <button
              onClick={toggleLanguage}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              {language === 'zh' ? 'ไทย' : '中文'}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* 用户信息 */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t(`auth.role.${user?.role}`)}
                    </div>
                  </div>
                </div>

                {/* 个人中心链接 */}
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.profile')}
                </Link>

                {/* 登出按钮 */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          <Link
            to="/"
            className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
          >
            {t('nav.home')}
          </Link>
          
          {isAuthenticated && (
            <>
              {(user?.role === 'customer' || user?.role === 'merchant' || user?.role === 'agent' || user?.role === 'admin') && (
                <Link
                  to={`/${user?.role === 'customer' ? 'user' : user.role}/dashboard`}
                  className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {t('nav.dashboard')}
                </Link>
              )}
              
              <Link
                to="/orders"
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                {t('nav.orders')}
              </Link>
              
              <Link
                to="/profile"
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                {t('nav.profile')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;