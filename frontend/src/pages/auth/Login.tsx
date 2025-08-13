import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error: any) {
      setError(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 快速填入测试账户
  const fillTestAccount = (email: string, password: string) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              立即注册
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="格式: example@domain.com (如: admin@ttkh.com)"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="密码格式: 6位以上字符 (如: admin123)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : t('auth.login')}
            </button>
          </div>

          {/* 测试账户提示 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">🔑 测试账户</h4>
            <div className="text-xs text-blue-600 space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div 
                  className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => fillTestAccount('admin@ttkh.com', 'admin123')}
                >
                  <strong className="text-blue-800">管理员:</strong> admin@ttkh.com / admin123
                  <br />
                  <span className="text-gray-500">权限: 系统管理、用户管理、订单管理</span>
                </div>
                <div 
                  className="bg-white p-2 rounded border cursor-pointer hover:bg-green-50 transition-colors"
                  onClick={() => fillTestAccount('merchant@ttkh.com', 'merchant123')}
                >
                  <strong className="text-green-800">商家:</strong> merchant@ttkh.com / merchant123
                  <br />
                  <span className="text-gray-500">权限: 产品管理、订单管理、库存管理</span>
                </div>
                <div 
                  className="bg-white p-2 rounded border cursor-pointer hover:bg-purple-50 transition-colors"
                  onClick={() => fillTestAccount('agent@ttkh.com', 'agent123')}
                >
                  <strong className="text-purple-800">代理:</strong> agent@ttkh.com / agent123
                  <br />
                  <span className="text-gray-500">权限: 客户管理、订单代理、佣金查看</span>
                </div>
                <div 
                  className="bg-white p-2 rounded border cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => fillTestAccount('customer@ttkh.com', 'customer123')}
                >
                  <strong className="text-orange-800">用户:</strong> customer@ttkh.com / customer123
                  <br />
                  <span className="text-gray-500">权限: 浏览产品、下单、查看订单</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-blue-700 font-medium">💡 点击任意账户信息可快速填入表单</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
export { Login };