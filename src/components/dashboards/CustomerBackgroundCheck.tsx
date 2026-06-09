import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, User, Briefcase, Link as LinkIcon, Loader2, Download, RefreshCw, Users } from 'lucide-react';
import { apiOSINTSearch, ApiOSINTProfile, apiGetRealOSINTUsers, apiScrapeRealUsers, apiDeleteRealOSINTUsers, ApiRealOSINTUser } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../shared/ui/Button';

export function CustomerBackgroundCheck() {
  const [activeTab, setActiveTab] = useState<'manual' | 'discover'>('manual');
  
  // Manual state
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ApiOSINTProfile | null>(null);

  // Discover state
  const [discoverUsers, setDiscoverUsers] = useState<ApiRealOSINTUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isFull, setIsFull] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverUsers();
    }
  }, [activeTab, page]);

  const fetchDiscoverUsers = async () => {
    setDiscoverLoading(true);
    try {
      const res = await apiGetRealOSINTUsers(page, limit);
      setDiscoverUsers(res.data);
      setTotal(res.total);
      setIsFull(res.is_full);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleScrape = async () => {
    if (isFull) {
      alert("Hệ thống đã đạt giới hạn 1000 người dùng theo yêu cầu. Không thể thu thập thêm để tránh quá tải!");
      return;
    }
    setScrapeLoading(true);
    try {
      const res = await apiScrapeRealUsers();
      if (res.status === 'limit_reached') {
        alert("Đã đạt giới hạn 1000 người dùng.");
      } else {
        alert(res.message);
      }
      fetchDiscoverUsers();
    } catch (err: any) {
      alert("Lỗi khi thu thập: " + err.message);
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn? Thao tác này không thể hoàn tác.`)) {
      try {
        const res = await apiDeleteRealOSINTUsers(selectedIds);
        alert(`Đã xóa thành công ${res.deleted} mục.`);
        setSelectedIds([]);
        fetchDiscoverUsers();
      } catch (err: any) {
        alert("Lỗi khi xóa: " + err.message);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (total === 0) return;
    if (window.confirm(`NGUY HIỂM: Bạn có chắc chắn muốn xóa TOÀN BỘ ${total} hồ sơ trong hệ thống không? Thao tác này KHÔNG THỂ khôi phục.`)) {
      try {
        const res = await apiDeleteRealOSINTUsers(['ALL']);
        alert(`Đã dọn sạch ${res.deleted} hồ sơ khỏi hệ thống.`);
        setSelectedIds([]);
        setPage(1);
        fetchDiscoverUsers();
      } catch (err: any) {
        alert("Lỗi khi xóa: " + err.message);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === discoverUsers.length && discoverUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(discoverUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    if (discoverUsers.length === 0) return;
    
    // We export the current page or we can fetch all, but let's export what's fetched
    // To export all, we would need a separate endpoint, but for now we export the current view or we can fetch all 1000.
    // Let's do a quick fetch of all for export
    const doExport = async () => {
      try {
        const res = await apiGetRealOSINTUsers(1, 1000); // Fetch up to 1000
        const data = res.data;
        const headers = ["ID", "Tên", "Chức vụ/Tiêu đề", "Email", "SĐT", "Xu hướng truy cập", "Nguồn", "URL", "Ngày thu thập", "Snippet"];
        const csvContent = [
          headers.join(","),
          ...data.map(u => 
            [
              u.id, 
              `"${u.name.replace(/"/g, '""')}"`, 
              `"${u.title.replace(/"/g, '""')}"`, 
              `"${u.email || ''}"`,
              `"${u.phone || ''}"`,
              `"${u.access_trend || ''}"`,
              u.source, 
              u.url, 
              u.scraped_at, 
              `"${(u.snippet || '').replace(/"/g, '""')}"`
            ].join(",")
          )
        ].join("\n");
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `osint_users_export_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        alert("Lỗi khi xuất dữ liệu.");
      }
    };
    doExport();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setProfile(null);

    try {
      const result = await apiOSINTSearch(query);
      setProfile(result);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tra cứu thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeUser = (name: string) => {
    setQuery(name);
    setActiveTab('manual');
    // We trigger the form submit programmatically by setting query and simulating the fetch
    setLoading(true);
    setProfile(null);
    apiOSINTSearch(name)
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getReputationIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="w-8 h-8 text-green-500" />;
    return <ShieldAlert className="w-8 h-8 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-100 mb-6 gap-6">
        <button
          type="button"
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('manual')}
        >
          <Search className="w-4 h-4" />
          Tra cứu thủ công
        </button>
        <button
          type="button"
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'discover' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('discover')}
        >
          <Users className="w-4 h-4" />
          Khám phá danh sách
        </button>
      </div>

      {activeTab === 'manual' && (
        <>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tra cứu Lý lịch Khách hàng (OSINT)</h2>
              <p className="text-gray-500">
                Hệ thống AI tự động thu thập thông tin công khai trên Internet (LinkedIn, Facebook, Báo chí) để đánh giá độ tin cậy của khách hàng/đối tác.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập tên, số điện thoại hoặc email khách hàng..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tra cứu'}
              </Button>
            </form>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium">
                {error}
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {profile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h3>
                  <p className="text-blue-600 font-medium flex items-center justify-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4" /> {profile.predicted_job}
                  </p>
                  
                  {(profile.email || profile.phone) && (
                    <div className="bg-gray-50 text-gray-700 text-sm py-2 px-4 rounded-xl w-full mb-4 break-all">
                      {profile.email && <p>✉️ {profile.email}</p>}
                      {profile.phone && <p>📞 {profile.phone}</p>}
                    </div>
                  )}

                  {profile.access_trend && (
                    <div className="bg-indigo-50 text-indigo-700 font-bold text-xs py-1.5 px-3 rounded-lg mb-6 border border-indigo-100">
                      🏷️ {profile.access_trend}
                    </div>
                  )}
                  
                  <div className={`w-full p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 ${getReputationColor(profile.reputation_score)}`}>
                    {getReputationIcon(profile.reputation_score)}
                    <span className="text-3xl font-black">{profile.reputation_score}/100</span>
                    <span className="text-sm font-medium">Điểm uy tín (AI đánh giá)</span>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      Nhận định từ AI
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 leading-relaxed">
                      {profile.summary}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      Nguồn dữ liệu tham khảo
                    </h4>
                    {profile.social_links && profile.social_links.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.social_links.map((link, idx) => (
                          <li key={idx}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-gray-600 font-medium break-all"
                            >
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <LinkIcon className="w-4 h-4" />
                              </div>
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">Không tìm thấy liên kết mạng xã hội công khai.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === 'discover' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Hồ sơ Người dùng Mở ({total}/1000)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Dữ liệu được hệ thống tự động cào ngẫu nhiên từ LinkedIn, Facebook,...
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <Button 
                  type="button"
                  variant="outline"
                  className="rounded-xl flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteSelected}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Xóa {selectedIds.length} mục
                </Button>
              )}
              {total > 0 && (
                <Button 
                  type="button"
                  variant="outline"
                  className="rounded-xl flex items-center gap-2 text-red-700 border-red-300 hover:bg-red-100 font-bold"
                  onClick={handleDeleteAll}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Xóa toàn bộ
                </Button>
              )}
              <Button 
                type="button"
                variant="outline" 
                className="rounded-xl flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
                onClick={exportToCSV}
                disabled={total === 0}
              >
                <Download className="w-4 h-4" />
                Xuất Excel (CSV)
              </Button>
              <Button 
                type="button"
                onClick={handleScrape} 
                disabled={scrapeLoading || isFull}
                className={`rounded-xl flex items-center gap-2 ${isFull ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {scrapeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isFull ? 'Đã đạt giới hạn 1000' : 'Thu thập thêm'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={discoverUsers.length > 0 && selectedIds.length === discoverUsers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="pb-3 font-bold">Người dùng</th>
                  <th className="pb-3 font-bold">Nguồn</th>
                  <th className="pb-3 font-bold hidden md:table-cell">Thu thập lúc</th>
                  <th className="pb-3 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {discoverLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : discoverUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      Chưa có hồ sơ nào. Bấm "Thu thập thêm" để AI đi cào dữ liệu mới.
                    </td>
                  </tr>
                ) : (
                  discoverUsers.map(u => (
                    <tr key={u.id} className={`transition-colors ${selectedIds.includes(u.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500 max-w-[200px] sm:max-w-[300px] truncate">{u.title}</p>
                            {(u.email || u.phone) && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">
                                {u.email} {u.email && u.phone && '•'} {u.phone}
                              </p>
                            )}
                            {u.access_trend && (
                              <p className="text-xs text-indigo-500 mt-0.5">🏷️ {u.access_trend}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                          u.source === 'LinkedIn' ? 'bg-blue-100 text-blue-700' :
                          u.source === 'Facebook' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.source}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-gray-500 hidden md:table-cell">
                        {new Date(u.scraped_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={u.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem trang gốc"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            onClick={() => analyzeUser(u.name)}
                          >
                            Phân tích sâu
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Hiển thị trang {page} ({(page - 1) * limit + 1} - {Math.min(page * limit, total)} / {total})
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="rounded-xl"
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
