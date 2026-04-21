import React, { useState, useEffect } from 'react';
import { Plus, X, Shield, Settings, Trash2, Loader2, Check } from 'lucide-react';

interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'agent' | 'user';
  kyc_verified: boolean;
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface UserPermission extends Permission {
  granted_at: string;
  granted_by_name?: string;
}

interface ModalState {
  isOpen: boolean;
  userId?: number;
  userName?: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [userPermissionsMap, setUserPermissionsMap] = useState<Record<number, UserPermission[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [modal, setModal] = useState<ModalState>({ isOpen: false });
  const [searchTerm, setSearchTerm] = useState('');

  console.log('✅ AdminUserManagement component rendered');
  console.log('📊 Component state:', { users: users.length, allPermissions: allPermissions.length, modalOpen: modal.isOpen });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all permissions and categories
  useEffect(() => {
    fetchPermissions();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/users/users.php');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users/permissions.php?action=list');
      const data = await res.json();
      if (data.status === 'success') {
        setAllPermissions(data.data);
        // Set default active category
        if (data.data.length > 0 && !activeCategory) {
          const firstCategory = data.data[0].category;
          setActiveCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users/permissions.php?action=categories');
      const data = await res.json();
      if (data.status === 'success') {
        setPermissionCategories(data.data);
        if (data.data.length > 0) {
          setActiveCategory(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const openModal = async (userId: number, userName: string) => {
    console.log('🔵 Opening modal for user:', userId, userName);
    setModal({ isOpen: true, userId, userName });
    setSelectedPermissions([]);
    
    // Kiểm tra cache trước
    if (userPermissionsMap[userId]) {
      console.log('✅ Using cached permissions');
      setUserPermissions(userPermissionsMap[userId]);
      setSelectedPermissions(userPermissionsMap[userId].map(p => p.id));
      return;
    }
    
    try {
      console.log('📡 Fetching permissions from API...');
      const res = await fetch(`http://localhost:8000/api/users/permissions.php?action=user&user_id=${userId}`);
      const data = await res.json();
      console.log('📦 API Response:', data);
      if (data.status === 'success') {
        const perms = data.data || [];
        setUserPermissions(perms);
        setUserPermissionsMap(prev => ({
          ...prev,
          [userId]: perms
        }));
        setSelectedPermissions(perms.map((p: UserPermission) => p.id));
        console.log('✅ Permissions loaded:', perms.length);
      } else {
        console.error('❌ API Error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching user permissions:', error);
      setUserPermissions([]);
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false });
    setSelectedPermissions([]);
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!modal.userId) return;

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/users/permissions.php?action=bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: modal.userId,
          permission_ids: selectedPermissions
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        alert('Cấp quyền thành công!');
        // Update cache
        const newPerms = allPermissions.filter(p => selectedPermissions.includes(p.id));
        setUserPermissionsMap(prev => ({
          ...prev,
          [modal.userId]: newPerms
        }));
        closeModal();
        fetchUsers();
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể lưu quyền'));
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Lỗi cấp quyền: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = allPermissions.filter(p => p.category === activeCategory);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Quản trị viên',
      agent: 'Đại lý',
      user: 'Người dùng'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Quản lý người dùng
              </h1>
              <p className="text-gray-600 mt-1">Quản lý quyền hạn và cài đặt người dùng</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <input
            type="text"
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
                {/* User Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                {/* KYC Status */}
                {user.kyc_verified && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    <span>KYC Đã xác minh</span>
                  </div>
                )}

                {/* User Permissions Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">
                    Quyền: <span className="font-semibold text-gray-900">
                      {(userPermissionsMap[user.id] || []).length} / {allPermissions.length}
                    </span>
                  </p>
                  {(userPermissionsMap[user.id] || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(userPermissionsMap[user.id] || []).slice(0, 3).map(perm => (
                        <span key={perm.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {perm.name}
                        </span>
                      ))}
                      {(userPermissionsMap[user.id] || []).length > 3 && (
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                          +{(userPermissionsMap[user.id] || []).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <p className="text-xs text-gray-500 mb-4">
                  Tạo: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </p>

                {/* Action Button */}
                <button
                  onClick={() => openModal(user.id, user.display_name)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Thiết lập quyền
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Permissions Management */}
      {modal.isOpen && modal.userId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quản lý quyền</h2>
                <p className="text-gray-600">{modal.userName}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                {permissionCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 font-medium rounded-lg transition ${
                      activeCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Permissions List */}
              <div className="space-y-3">
                {filteredPermissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có quyền trong danh mục này</p>
                ) : (
                  filteredPermissions.map(permission => (
                    <label
                      key={permission.id}
                      className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="w-5 h-5 text-blue-600 rounded mt-1 cursor-pointer"
                      />
                      <div className="ml-4 flex-1">
                        <h4 className="font-semibold text-gray-900">{permission.name}</h4>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Current Permissions */}
              {userPermissions.length > 0 && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Quyền hiện tại ({userPermissions.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPermissions.map(perm => (
                      <span key={perm.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {perm.name}
                        <span className="text-xs text-blue-600">✓</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
