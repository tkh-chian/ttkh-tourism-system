const fs = require('fs').promises;
const path = require('path');

async function fixFrontendOrdersDisplay() {
  console.log('🔧 修复前端订单显示问题...');
  
  try {
    // 1. 检查前端API调用
    console.log('\n1️⃣ 检查前端API调用...');
    
    // 查找前端API服务文件
    const apiServicePath = path.join(__dirname, 'frontend', 'src', 'services', 'api.ts');
    let apiServiceContent;
    
    try {
      apiServiceContent = await fs.readFile(apiServicePath, 'utf8');
      console.log('✅ 成功读取API服务文件');
    } catch (error) {
      console.log(`❌ 读取API服务文件失败: ${error.message}`);
      return;
    }
    
    // 检查是否包含客户订单API
    if (!apiServiceContent.includes('/api/customer/orders')) {
      console.log('⚠️ API服务文件中未找到客户订单API调用');
      
      // 添加客户订单API
      const updatedApiContent = apiServiceContent.replace(
        /export const api = {/,
        `export const api = {
  // 客户订单API
  getCustomerOrders: () => {
    return axiosInstance.get('/api/customer/orders');
  },`
      );
      
      await fs.writeFile(apiServicePath, updatedApiContent);
      console.log('✅ 已添加客户订单API调用');
    } else {
      console.log('✅ API服务文件已包含客户订单API调用');
    }
    
    // 2. 检查订单页面组件
    console.log('\n2️⃣ 检查订单页面组件...');
    
    // 查找订单页面组件
    const ordersPagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Orders.tsx');
    let ordersPageContent;
    
    try {
      ordersPageContent = await fs.readFile(ordersPagePath, 'utf8');
      console.log('✅ 成功读取订单页面组件');
    } catch (error) {
      console.log(`❌ 读取订单页面组件失败: ${error.message}`);
      
      // 创建订单页面组件
      const newOrdersPageContent = `import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, message, Spin } from 'antd';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomerOrders();
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        message.error('获取订单失败');
      }
    } catch (error) {
      console.error('获取订单错误:', error);
      message.error('获取订单时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: '产品名称',
      dataIndex: 'product_title',
      key: 'product_title',
    },
    {
      title: '出行日期',
      dataIndex: 'travel_date',
      key: 'travel_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '人数',
      dataIndex: 'total_people',
      key: 'total_people',
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => \`฿\${price}\`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'confirmed') color = 'green';
        if (status === 'rejected' || status === 'cancelled') color = 'red';
        if (status === 'completed') color = 'purple';
        
        return <Tag color={color}>{status || 'pending'}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>我的订单</Title>
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          dataSource={orders} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无订单' }}
        />
      )}
    </div>
  );
};

export default Orders;
`;
      
      await fs.writeFile(ordersPagePath, newOrdersPageContent);
      console.log('✅ 已创建订单页面组件');
      ordersPageContent = newOrdersPageContent;
    }
    
    // 检查订单页面组件是否正确
    if (!ordersPageContent.includes('api.getCustomerOrders')) {
      console.log('⚠️ 订单页面组件中未找到客户订单API调用');
      
      // 修复订单页面组件
      const updatedOrdersPageContent = ordersPageContent.replace(
        /const fetchOrders = async \(\) => {[\s\S]*?try {[\s\S]*?setLoading\(true\);([\s\S]*?)setLoading\(false\);/m,
        `const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomerOrders();
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        message.error('获取订单失败');
      }
    } catch (error) {
      console.error('获取订单错误:', error);
      message.error('获取订单时发生错误');
    } finally {
      setLoading(false);`
      );
      
      await fs.writeFile(ordersPagePath, updatedOrdersPageContent);
      console.log('✅ 已修复订单页面组件');
    } else {
      console.log('✅ 订单页面组件已包含客户订单API调用');
    }
    
    // 3. 检查路由配置
    console.log('\n3️⃣ 检查路由配置...');
    
    // 查找App.tsx文件
    const appPath = path.join(__dirname, 'frontend', 'src', 'App.tsx');
    let appContent;
    
    try {
      appContent = await fs.readFile(appPath, 'utf8');
      console.log('✅ 成功读取App.tsx文件');
    } catch (error) {
      console.log(`❌ 读取App.tsx文件失败: ${error.message}`);
      return;
    }
    
    // 检查是否包含订单路由
    if (!appContent.includes('path="/orders"') && !appContent.includes("path='/orders'")) {
      console.log('⚠️ App.tsx中未找到订单路由');
      
      // 添加订单路由
      const updatedAppContent = appContent.replace(
        /<Routes>([\s\S]*?)<\/Routes>/m,
        `<Routes>$1
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        </Routes>`
      );
      
      // 添加导入语句
      const updatedAppContentWithImport = updatedAppContent.replace(
        /import {[\s\S]*?} from 'react-router-dom';/m,
        match => {
          if (!match.includes('Orders')) {
            return match + `\nimport Orders from './pages/Orders';`;
          }
          return match;
        }
      );
      
      await fs.writeFile(appPath, updatedAppContentWithImport);
      console.log('✅ 已添加订单路由');
    } else {
      console.log('✅ App.tsx已包含订单路由');
    }
    
    // 4. 检查导航菜单
    console.log('\n4️⃣ 检查导航菜单...');
    
    // 查找Header组件
    const headerPath = path.join(__dirname, 'frontend', 'src', 'components', 'Layout', 'Header.tsx');
    let headerContent;
    
    try {
      headerContent = await fs.readFile(headerPath, 'utf8');
      console.log('✅ 成功读取Header组件');
    } catch (error) {
      console.log(`❌ 读取Header组件失败: ${error.message}`);
      return;
    }
    
    // 检查是否包含订单菜单项
    if (!headerContent.includes('to="/orders"') && !headerContent.includes("to='/orders'")) {
      console.log('⚠️ Header组件中未找到订单菜单项');
      
      // 添加订单菜单项
      const updatedHeaderContent = headerContent.replace(
        /(isAuthenticated && user\.role === 'customer'[\s\S]*?)(\s*<\/Menu>)/m,
        `$1
              <Menu.Item key="orders">
                <Link to="/orders">我的订单</Link>
              </Menu.Item>$2`
      );
      
      await fs.writeFile(headerPath, updatedHeaderContent);
      console.log('✅ 已添加订单菜单项');
    } else {
      console.log('✅ Header组件已包含订单菜单项');
    }
    
    // 5. 总结修复结果
    console.log('\n🔍 前端修复总结:');
    console.log('1. 已检查并修复API服务文件');
    console.log('2. 已检查并修复订单页面组件');
    console.log('3. 已检查并修复路由配置');
    console.log('4. 已检查并修复导航菜单');
    
    console.log('\n🚀 请重新启动前端服务并刷新页面以查看订单');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复脚本
fixFrontendOrdersDisplay().catch(console.error);