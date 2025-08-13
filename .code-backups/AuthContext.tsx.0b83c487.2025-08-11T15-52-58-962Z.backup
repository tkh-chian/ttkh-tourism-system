import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 完全静态的初始化，避免任何副作用
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });

      // 检查响应格式
      if (response.data) {
        // 处理新的响应格式 { success: true, data: { user, token } }
        if (response.data.success && response.data.data) {
          const { user: userData, token: userToken } = response.data.data;
          
          setUser(userData);
          setToken(userToken);
          
          localStorage.setItem('token', userToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          console.log('✅ 登录成功，用户数据已保存:', userData);
          return; // 成功登录，直接返回
        }
        // 处理旧的响应格式 { user, token }
        else if (response.data.user && response.data.token) {
          const { user: userData, token: userToken } = response.data;
          
          setUser(userData);
          setToken(userToken);
          
          localStorage.setItem('token', userToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          console.log('✅ 登录成功，用户数据已保存:', userData);
          return; // 成功登录，直接返回
        }
        // 如果有错误消息
        else if (response.data.message) {
          throw new Error(response.data.message);
        }
      }
      
      // 如果没有有效数据
      throw new Error('登录响应格式异常');
      
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
      // 只有真正的错误才抛出
      if (error.message && !error.message.includes('登录成功')) {
        throw new Error(error.response?.data?.message || error.message || '登录失败');
      } else {
        throw new Error('登录失败，请检查用户名和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // 更新用户信息
  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 检查是否已认证
  const isAuthenticated = !!user && !!token;

  // 检查用户角色
  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;