import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Orders from './pages/Orders';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// 页面组件
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// 商家页面
import MerchantDashboard from './pages/merchant/Dashboard';
import MerchantProducts from './pages/merchant/Products';
import MerchantOrders from './pages/merchant/Orders';
import CreateProduct from './pages/merchant/CreateProduct';
import EditProduct from './pages/merchant/EditProduct';
import ProductSchedule from './pages/merchant/ProductSchedule';

// 用户页面
import UserDashboard from './pages/user/Dashboard';

// 代理商页面
import AgentDashboard from './pages/agent/Dashboard';
import AgentCustomers from './pages/agent/Customers';
import AgentOrders from './pages/agent/Orders';
import AgentCommission from './pages/agent/Commission';
import AgentInvite from './pages/agent/Invite';

// 管理员页面
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminMerchants from './pages/admin/Merchants';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCategories from './pages/admin/Categories';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* 公共路由 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* 需要布局的路由 */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products/:id" element={<ProductDetail />} />
                
                {/* 需要认证的路由 */}
                <Route element={<ProtectedRoute />}>
                  <Route path="orders" element={<Orders />} />
                  <Route path="profile" element={<Profile />} />
                  
                  {/* 用户控制台 */}
                  <Route path="user">
                    <Route path="dashboard" element={<UserDashboard />} />
                  </Route>
                  
                  {/* 代理商路由 */}
                  <Route path="agent">
                    <Route path="dashboard" element={<AgentDashboard />} />
                    <Route path="customers" element={<AgentCustomers />} />
                    <Route path="orders" element={<AgentOrders />} />
                    <Route path="commission" element={<AgentCommission />} />
                    <Route path="invite" element={<AgentInvite />} />
                  </Route>
                  
                  {/* 商家路由 */}
                  <Route path="merchant">
                    <Route path="dashboard" element={<MerchantDashboard />} />
                    <Route path="products" element={<MerchantProducts />} />
                    <Route path="orders" element={<MerchantOrders />} />
                    <Route path="orders/:id" element={<MerchantOrders />} />
                    <Route path="products/create" element={<CreateProduct />} />
                    <Route path="products/:id/edit" element={<EditProduct />} />
                    <Route path="products/:id/schedule" element={<ProductSchedule />} />
                  </Route>
                  
                  {/* 管理员路由 */}
                  <Route path="admin">
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="merchants" element={<AdminMerchants />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;