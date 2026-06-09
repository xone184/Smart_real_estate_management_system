import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Check, Zap, Sparkles, Package, X, Users, Activity, ExternalLink, TrendingUp, Heart } from 'lucide-react';

interface UserAnalytics {
  id: number;
  email: string;
  display_name: string;
  source: 'system' | 'facebook' | 'tiktok' | 'google';
  created_at: string;
  recent_visits: number;
  news_likes: number;
  interest_trends: string[];
}

const AdminUserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'external'>('system');
  const [systemUsers, setSystemUsers] = useState<UserAnalytics[]>([]);
  const [externalUsers, setExternalUsers] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/smart-real-estate-management-system/api/analytics/admin_users.php');
      const json = await res.json();
      if (json.status === 'success') {
        setSystemUsers(json.data.system || []);
        setExternalUsers(json.data.external || []);
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanInternet = async () => {
    try {
      setLoading(true);
      // Gọi API cào dữ liệu mới từ Internet
      await fetch('/smart-real-estate-management-system/api/analytics/cron_collect.php');
      // Sau khi cào xong, làm mới lại danh sách hiển thị
      await fetchUsers();
    } catch (error) {
      console.error('Error scanning internet data:', error);
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">Facebook</span>;
      case 'tiktok': return <span className="px-2 py-1 bg-black text-white rounded-lg text-xs font-bold">TikTok</span>;
      case 'google': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">Google</span>;
      case 'reddit': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">Reddit</span>;
      case 'google_news': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">Google News</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">Hệ thống</span>;
    }
  };

  const currentUsers = activeTab === 'system' ? systemUsers : externalUsers;
  const filteredUsers = currentUsers.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Dữ liệu & Hành vi Người dùng
              </h1>
              <p className="text-gray-500 mt-2">Quản lý tài khoản hệ thống và dữ liệu thu thập từ các nền tảng ngoài</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleScanInternet}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Quét dữ liệu Internet
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                Làm mới hiển thị
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
                activeTab === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Hệ thống
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{systemUsers.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
                activeTab === 'external' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Bên ngoài (Thu thập)
              <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">{externalUsers.length}</span>
            </button>
          </div>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        {loading && currentUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Không tìm thấy dữ liệu nào phù hợp</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 text-gray-500 text-sm border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Tên tài khoản</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Lượt truy cập</th>
                    <th className="px-6 py-4 font-semibold">Lượt thích tin</th>
                    <th className="px-6 py-4 font-semibold w-1/4">Xu hướng quan tâm</th>
                    <th className="px-6 py-4 font-semibold">Nguồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            activeTab === 'system' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {user.display_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-bold text-gray-900">{user.display_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span className="font-bold">{user.recent_visits}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span className="font-bold">{user.news_likes}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.interest_trends && user.interest_trends.length > 0 ? (
                            user.interest_trends.map((trend, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-gray-400" />
                                {trend}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Chưa có dữ liệu</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getSourceIcon(user.source)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
