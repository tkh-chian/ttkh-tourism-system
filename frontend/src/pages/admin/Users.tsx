import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { 
  Users as UsersIcon, 
  Search, 
  Filter,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'merchant' | 'admin' | 'agent';
  status: 'active' | 'inactive' | 'banned' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const AdminUsers: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 角色过滤
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm(language === 'zh' ? '确定要删除这个用户吗？' : 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  const getRoleText = (role: string) => {
    const roleMap = {
      'admin': language === 'zh' ? '管理员' : 'ผู้ดูแลระบบ',
      'merchant': language === 'zh' ? '商家' : 'ผู้ขาย',
      'agent': language === 'zh' ? '代理' : 'ตัวแทน',
      'user': language === 'zh' ? '用户' : 'ผู้ใช้'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'active': language === 'zh' ? '活跃' : 'ใช้งาน',
      'inactive': language === 'zh' ? '未激活' : 'ไม่ใช้งาน',
      'banned': language === 'zh' ? '已封禁' : 'ถูกแบน',
      'pending': language === 'zh' ? '待审核' : 'รอการอนุมัติ',
      'approved': language === 'zh' ? '已批准' : 'อนุมัติแล้ว',
      'rejected': language === 'zh' ? '已拒绝' : 'ปฏิเสธแล้ว'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'active': 'success',
      'inactive': 'secondary',
      'banned': 'danger',
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    return colorMap[status as keyof typeof colorMap] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'zh' ? '用户管理' : 'จัดการผู้ใช้'}
              </h1>
              <p className="mt-2 text-gray-600">
                {language === 'zh' ? '管理系统中的所有用户' : 'จัดการผู้ใช้ทั้งหมดในระบบ'}
              </p>
            </div>
          </div>
          <Button onClick={() => {
            setSelectedUser(null);
            setIsEditing(false);
            setShowUserModal(true);
          }}>
            <UserPlus className="h-4 w-4 mr-2" />
            {language === 'zh' ? '添加用户' : 'เพิ่มผู้ใช้'}
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={language === 'zh' ? '搜索用户名或邮箱' : 'ค้นหาชื่อผู้ใช้หรืออีเมล'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'zh' ? '所有角色' : 'ทุกบทบาท'}</option>
            <option value="admin">{language === 'zh' ? '管理员' : 'ผู้ดูแลระบบ'}</option>
            <option value="merchant">{language === 'zh' ? '商家' : 'ผู้ขาย'}</option>
            <option value="agent">{language === 'zh' ? '代理' : 'ตัวแทน'}</option>
            <option value="user">{language === 'zh' ? '用户' : 'ผู้ใช้'}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'zh' ? '所有状态' : 'ทุกสถานะ'}</option>
            <option value="active">{language === 'zh' ? '活跃' : 'ใช้งาน'}</option>
            <option value="inactive">{language === 'zh' ? '未激活' : 'ไม่ใช้งาน'}</option>
            <option value="banned">{language === 'zh' ? '已封禁' : 'ถูกแบน'}</option>
            <option value="pending">{language === 'zh' ? '待审核' : 'รอการอนุมัติ'}</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {language === 'zh' ? `共 ${filteredUsers.length} 个用户` : `ทั้งหมด ${filteredUsers.length} ผู้ใช้`}
          </div>
        </div>
      </Card>

      {/* 用户列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '用户信息' : 'ข้อมูลผู้ใช้'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '角色' : 'บทบาท'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '状态' : 'สถานะ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '注册时间' : 'วันที่สมัคร'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'zh' ? '操作' : 'การดำเนินการ'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary">
                      {getRoleText(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(user.status) as any}>
                      {getStatusText(user.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditing(false);
                          setShowUserModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditing(true);
                          setShowUserModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(user.id, 'banned')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {language === 'zh' ? '没有找到用户' : 'ไม่พบผู้ใช้'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件' : 'ลองปรับเงื่อนไขการค้นหา'}
            </p>
          </div>
        )}
      </Card>

      {/* 用户详情/编辑模态框 */}
      {showUserModal && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title={
            isEditing 
              ? (language === 'zh' ? '编辑用户' : 'แก้ไขผู้ใช้')
              : (language === 'zh' ? '用户详情' : 'รายละเอียดผู้ใช้')
          }
        >
          <div className="space-y-4">
            {selectedUser ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '用户名' : 'ชื่อผู้ใช้'}
                  </label>
                  <Input
                    type="text"
                    value={selectedUser.username}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '邮箱' : 'อีเมล'}
                  </label>
                  <Input
                    type="email"
                    value={selectedUser.email}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '电话' : 'เบอร์โทร'}
                  </label>
                  <Input
                    type="text"
                    value={selectedUser.phone || ''}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '角色' : 'บทบาท'}
                  </label>
                  <select
                    value={selectedUser.role}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="user">{language === 'zh' ? '用户' : 'ผู้ใช้'}</option>
                    <option value="merchant">{language === 'zh' ? '商家' : 'ผู้ขาย'}</option>
                    <option value="agent">{language === 'zh' ? '代理' : 'ตัวแทน'}</option>
                    <option value="admin">{language === 'zh' ? '管理员' : 'ผู้ดูแลระบบ'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '状态' : 'สถานะ'}
                  </label>
                  <select
                    value={selectedUser.status}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="active">{language === 'zh' ? '活跃' : 'ใช้งาน'}</option>
                    <option value="inactive">{language === 'zh' ? '未激活' : 'ไม่ใช้งาน'}</option>
                    <option value="banned">{language === 'zh' ? '已封禁' : 'ถูกแบน'}</option>
                    <option value="pending">{language === 'zh' ? '待审核' : 'รอการอนุมัติ'}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'zh' ? '注册时间' : 'วันที่สมัคร'}
                    </label>
                    <Input
                      type="text"
                      value={new Date(selectedUser.created_at).toLocaleString()}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'zh' ? '更新时间' : 'วันที่อัปเดต'}
                    </label>
                    <Input
                      type="text"
                      value={new Date(selectedUser.updated_at).toLocaleString()}
                      disabled
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p>{language === 'zh' ? '添加新用户功能开发中...' : 'ฟีเจอร์เพิ่มผู้ใช้ใหม่กำลังพัฒนา...'}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUserModal(false)}
              >
                {language === 'zh' ? '取消' : 'ยกเลิก'}
              </Button>
              {isEditing && (
                <Button onClick={() => {
                  // TODO: 实现保存功能
                  setShowUserModal(false);
                }}>
                  {language === 'zh' ? '保存' : 'บันทึก'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;