import React, { useState, useEffect } from 'react';
import { X, Shield, Settings, Loader2, Check, Zap, Sparkles, Package } from 'lucide-react';

interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'agent' | 'user';
  kyc_verified: boolean;
  subscription_plan?: string;
  created_at: string;
}

interface ModalState {
  isOpen: boolean;
  userId?: number;
  userName?: string;
  currentPlan?: string;
}

const PLAN_DATA = [
  {
    id: 'basic',
    name: 'Cơ bản',
    price: 'Miễn phí',
    features: [
      'Đăng tối đa 3 tin/tháng',
      'Hiển thị trong 7 ngày',
      'Hỗ trợ AI viết mô tả cơ bản',
      'Thống kê lượt xem cơ bản'
    ],
    icon: <Package className="w-5 h-5" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  {
    id: 'professional',
    name: 'Chuyên nghiệp',
    price: '499.000đ/tháng',
    features: [
      'Đăng tin không giới hạn',
      'Đẩy tin top 1 lần/ngày',
      'AI định giá & phân tích thị trường',
      'Hỗ trợ tour 3D & Video HLS',
      'Xác minh KYC ưu tiên'
    ],
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    features: [
      'Quản lý đội nhóm môi giới',
      'Dashboard phân tích chuyên sâu',
      'API tích hợp hệ thống riêng',
      'Hỗ trợ 24/7 riêng biệt',
      'Watermark thương hiệu riêng'
    ],
    icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    color: 'bg-purple-50 text-purple-800 border-purple-200'
  }
];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/smart-real-estate-management-system/api/users/users.php');
      const data = await res.json();
      // Since users.php might not return subscription_plan yet, we'll fetch them from admin_list if needed
      // but for now let's assume it's in the data or we'll update it when modal opens
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: User) => {
    setModal({ 
      isOpen: true, 
      userId: user.id, 
      userName: user.display_name,
      currentPlan: user.subscription_plan || 'basic'
    });
    setSelectedPlan(user.subscription_plan || 'basic');
  };

  const closeModal = () => {
    setModal({ isOpen: false });
  };

  const handleSavePlan = async () => {
    if (!modal.userId) return;

    try {
      setLoading(true);
      const planInfo = PLAN_DATA.find(p => p.id === selectedPlan);
      const res = await fetch('/smart-real-estate-management-system/api/subscriptions/subscriptions.php?action=admin_assign_plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: modal.userId,
          plan_name: selectedPlan,
          plan_label: planInfo?.name
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Gán gói dịch vụ thành công!');
        closeModal();
        fetchUsers();
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể gán gói'));
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Quản lý gói dịch vụ người dùng
              </h1>
              <p className="text-gray-500 mt-2">Thiết lập đặc quyền và giới hạn dựa trên gói dịch vụ linh hoạt</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Làm mới danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc tên người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* User Grid */}
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Không tìm thấy người dùng nào phù hợp</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold border border-blue-100">
                      {user.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{user.display_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-sm text-gray-500">Vai trò</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'admin' ? 'Quản trị viên' : user.role === 'agent' ? 'Đại lý' : 'Người dùng'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-sm text-blue-600 font-medium">Gói hiện tại</span>
                    <span className="text-sm font-bold text-blue-700 capitalize">
                      {user.subscription_plan || 'Cơ bản'}
                    </span>
                  </div>
                </div>

                {user.role !== 'admin' && (
                  <button
                    onClick={() => openModal(user)}
                    className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <Settings className="w-4 h-4" />
                    Thiết lập gói dịch vụ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Plan Selection */}
      {modal.isOpen && modal.userId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-5xl w-full my-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Thiết lập gói dịch vụ</h2>
                <p className="text-gray-500">Người dùng: <span className="font-bold text-blue-600">{modal.userName}</span></p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLAN_DATA.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col h-full ${
                      selectedPlan === plan.id 
                        ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' 
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Phổ biến nhất
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${plan.color}`}>
                        {plan.icon}
                      </div>
                      {selectedPlan === plan.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-lg font-bold text-blue-600 mb-6">{plan.price}</p>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.id && (
                      <div className="text-center py-2 bg-blue-600 text-white rounded-xl text-xs font-bold animate-in slide-in-from-bottom-2">
                        Đã chọn
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-4 bg-gray-50/50 rounded-b-[2.5rem]">
              <button
                onClick={closeModal}
                className="px-8 py-3 text-gray-600 font-bold hover:text-gray-900 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSavePlan}
                disabled={loading}
                className="px-10 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-blue-100"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Xác nhận nâng cấp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
