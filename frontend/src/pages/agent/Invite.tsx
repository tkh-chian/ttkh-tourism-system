import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { 
  UserPlus, 
  Mail, 
  Phone,
  User,
  Copy,
  Send,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Invite {
  id: number;
  email: string;
  phone: string;
  name: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  accepted_at: string | null;
}

const AgentInvite: React.FC = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/agent/invites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取邀请记录失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setInvites(result.data);
      } else {
        throw new Error(result.message || '获取邀请记录失败');
      }
    } catch (error) {
      console.error('获取邀请记录失败:', error);
      setInvites([]);
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert(language === 'zh' ? '请填写姓名和邮箱' : 'กรุณากรอกชื่อและอีเมล');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/agent/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('发送邀请失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedInviteCode(result.data.inviteCode);
        setShowSuccess(true);
        setFormData({ name: '', email: '', phone: '' });
        fetchInvites(); // 刷新邀请列表
      } else {
        throw new Error(result.message || '发送邀请失败');
      }
    } catch (error) {
      console.error('发送邀请失败:', error);
      alert(language === 'zh' ? '发送邀请失败，请重试' : 'ส่งคำเชิญไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/register?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert(language === 'zh' ? '邀请链接已复制到剪贴板' : 'คัดลอกลิงก์เชิญแล้ว');
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { 
        variant: 'warning' as const, 
        text: language === 'zh' ? '待接受' : 'รอรับ',
        icon: Clock
      },
      accepted: { 
        variant: 'success' as const, 
        text: language === 'zh' ? '已接受' : 'รับแล้ว',
        icon: CheckCircle
      },
      expired: { 
        variant: 'secondary' as const, 
        text: language === 'zh' ? '已过期' : 'หมดอายุ',
        icon: XCircle
      }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      variant: 'secondary' as const, 
      text: status,
      icon: Clock
    };
    
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'zh' ? '邀请客户' : 'เชิญลูกค้า'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'zh' ? '邀请新客户注册并建立代理关系' : 'เชิญลูกค้าใหม่สมัครสมาชิกและสร้างความสัมพันธ์ตัวแทน'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 邀请表单 */}
        <div>
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <UserPlus className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'zh' ? '发送邀请' : 'ส่งคำเชิญ'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'zh' ? '客户姓名 *' : 'ชื่อลูกค้า *'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'zh' ? '请输入客户姓名' : 'กรุณากรอกชื่อลูกค้า'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'zh' ? '邮箱地址 *' : 'อีเมล *'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'zh' ? '请输入邮箱地址' : 'กรุณากรอกอีเมล'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'zh' ? '联系电话' : 'เบอร์โทรศัพท์'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'zh' ? '请输入联系电话' : 'กรุณากรอกเบอร์โทรศัพท์'}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {language === 'zh' ? '发送邀请' : 'ส่งคำเชิญ'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* 成功提示 */}
          {showSuccess && (
            <Card className="p-6 mt-6 bg-green-50 border-green-200">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-green-900">
                  {language === 'zh' ? '邀请发送成功！' : 'ส่งคำเชิญสำเร็จ!'}
                </h3>
              </div>
              <p className="text-green-700 mb-4">
                {language === 'zh' ? '邀请码已生成，请将以下链接发送给客户：' : 'สร้างรหัสเชิญแล้ว กรุณาส่งลิงก์ต่อไปนี้ให้ลูกค้า:'}
              </p>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <code className="flex-1 text-sm text-gray-800 break-all">
                  {`${window.location.origin}/register?invite=${generatedInviteCode}`}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyInviteCode(generatedInviteCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setShowSuccess(false)}
              >
                {language === 'zh' ? '关闭' : 'ปิด'}
              </Button>
            </Card>
          )}
        </div>

        {/* 邀请记录 */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'zh' ? '邀请记录' : 'บันทึกคำเชิญ'}
              </h2>
              <Badge variant="secondary">
                {invites.length} {language === 'zh' ? '条记录' : 'รายการ'}
              </Badge>
            </div>

            {invitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : invites.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{invite.name}</h3>
                        <p className="text-sm text-gray-600">{invite.email}</p>
                        {invite.phone && (
                          <p className="text-sm text-gray-600">{invite.phone}</p>
                        )}
                      </div>
                      {getStatusBadge(invite.status)}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        {invite.invite_code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteCode(invite.invite_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        {language === 'zh' ? '创建时间: ' : 'วันที่สร้าง: '}
                        {formatDate(invite.created_at)}
                      </p>
                      {invite.accepted_at && (
                        <p>
                          {language === 'zh' ? '接受时间: ' : 'วันที่รับ: '}
                          {formatDate(invite.accepted_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'zh' ? '暂无邀请记录' : 'ไม่มีบันทึกคำเชิญ'}
                </h3>
                <p className="text-gray-500">
                  {language === 'zh' ? '开始邀请您的第一个客户吧！' : 'เริ่มเชิญลูกค้าคนแรกของคุณกันเถอะ!'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 使用说明 */}
      <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          {language === 'zh' ? '使用说明' : 'คำแนะนำการใช้งาน'}
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>• {language === 'zh' ? '填写客户信息并发送邀请，系统会生成专属邀请码' : 'กรอกข้อมูลลูกค้าและส่งคำเชิญ ระบบจะสร้างรหัสเชิญเฉพาะ'}</p>
          <p>• {language === 'zh' ? '将邀请链接发送给客户，客户通过链接注册后会自动关联到您' : 'ส่งลิงก์เชิญให้ลูกค้า เมื่อลูกค้าสมัครผ่านลิงก์จะเชื่อมโยงกับคุณโดยอัตโนมัติ'}</p>
          <p>• {language === 'zh' ? '客户的所有订单都会为您产生佣金收入' : 'คำสั่งซื้อทั้งหมดของลูกค้าจะสร้างรายได้คอมมิชชั่นให้คุณ'}</p>
          <p>• {language === 'zh' ? '您可以在客户管理页面查看所有推荐的客户' : 'คุณสามารถดูลูกค้าที่แนะนำทั้งหมดในหน้าจัดการลูกค้า'}</p>
        </div>
      </Card>
    </div>
  );
};

export default AgentInvite;

// 确保这是一个模块
export {};