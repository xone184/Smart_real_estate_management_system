import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import {
  Users,
  Home,
  CheckCircle,
  XCircle,
  BarChart3,
  Shield,
  Search,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  BadgeCheck,
  Ban,
  Loader2,
  Star,
  Zap,
  Sparkles,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  apiGetProperties,
  apiGetUsers,
  apiUpdateProperty,
  apiBulkUpdatePropertyStatus,
  apiDeleteProperty,
  apiAdminGetSubscriptions,
  apiUpdateSubscriptionStatus,
  AuthUser,
  ApiSubscription,
  apiAdminExportReport,
  AdminReportEntity,
} from '../../services/api';
import { Property, UserProfile } from '../../types';
import { MarketDashboard } from './MarketDashboard';
import { PropertyMortgage } from '../property/PropertyMortgage';

// ─── Plan config ────────────────────────────────────────────────────────────
const planMeta: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  basic: {
    label: 'Cơ bản',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  professional: {
    label: 'Chuyên nghiệp',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  enterprise: {
    label: 'Doanh nghiệp',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Chờ duyệt',  color: 'text-orange-600', bg: 'bg-orange-50'  },
  active:    { label: 'Đang hoạt động', color: 'text-green-600',  bg: 'bg-green-50'  },
  rejected:  { label: 'Từ chối',    color: 'text-red-600',    bg: 'bg-red-50'     },
  cancelled: { label: 'Đã huỷ',    color: 'text-gray-500',   bg: 'bg-gray-100'   },
};

// ─── Component ───────────────────────────────────────────────────────────────
interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users' | 'subscriptions'>('overview');
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Report/filter UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportEntity, setReportEntity] = useState<AdminReportEntity>('properties');
  const [filters, setFilters] = useState<{
    from: string;
    to: string;
    status: string;
    type: string;
    search: string;
  }>({ from: '', to: '', status: '', type: '', search: '' });
  const [propSearch, setPropSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState<'all' | 'pending' | 'active' | 'sold' | 'rejected'>('all');
  const [propertyFromDate, setPropertyFromDate] = useState('');
  const [propertyToDate, setPropertyToDate] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, propSearch, userSearch, subFilter, propertyStatusFilter, propertyFromDate, propertyToDate, filters]);

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [propsData, usersData, subsData] = await Promise.all([
        apiGetProperties(),
        apiGetUsers(),
        apiAdminGetSubscriptions(),
      ]);
      setProperties(propsData as Property[]);
      setUsers(usersData as UserProfile[]);
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    // Server-side filter for properties; client-side for users; subscriptions handled by its own tab filter
    setLoading(true);
    try {
      const [propsData, usersData] = await Promise.all([
        apiGetProperties({
          status: filters.status || undefined,
          type: filters.type || undefined,
          search: filters.search || undefined,
          created_from: filters.from || undefined,
          created_to: filters.to || undefined,
        }),
        apiGetUsers(),
      ]);
      setProperties(propsData as Property[]);
      setUsers(usersData as UserProfile[]);
      showToast('Đã áp dụng bộ lọc');
    } catch (err: any) {
      showToast(err.message || 'Không thể áp dụng bộ lọc', 'error');
    } finally {
      setLoading(false);
      setFilterOpen(false);
    }
  };

  const resetFilters = async () => {
    setFilters({ from: '', to: '', status: '', type: '', search: '' });
    setPropSearch('');
    setUserSearch('');
    setLoading(true);
    try {
      const [propsData, usersData] = await Promise.all([apiGetProperties(), apiGetUsers()]);
      setProperties(propsData as Property[]);
      setUsers(usersData as UserProfile[]);
      showToast('Đã xoá bộ lọc');
    } catch (err: any) {
      showToast(err.message || 'Không thể tải lại dữ liệu', 'error');
    } finally {
      setLoading(false);
      setFilterOpen(false);
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const blob = await apiAdminExportReport({
        entity: reportEntity,
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `smartre_${reportEntity}_${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Đã xuất báo cáo CSV');
      setExportOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Xuất báo cáo thất bại', 'error');
    } finally {
      setExporting(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubLoading(true);
    try {
      const data = await apiAdminGetSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubLoading(false);
    }
  };

  // Lazy load subscriptions tab
  useEffect(() => {
    if (activeTab === 'subscriptions' && subscriptions.length === 0) {
      fetchSubscriptions();
    }
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    try {
      await apiUpdateProperty(id, { status: 'active', reject_reason: null } as any);
      showToast('Đã duyệt tin đăng');
      await fetchData();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối tin đăng:');
    if (reason === null) return;
    if (!reason.trim()) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }
    try {
      await apiUpdateProperty(id, { status: 'rejected', reject_reason: reason.trim() } as any);
      showToast('Đã từ chối tin đăng');
      await fetchData();
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleBulkPropertyStatus = async (status: 'active' | 'rejected') => {
    if (selectedPropertyIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 tin đăng', 'error');
      return;
    }

    let rejectReason = '';
    if (status === 'rejected') {
      const reason = prompt('Nhập lý do từ chối cho các tin đã chọn:');
      if (reason === null) return;
      if (!reason.trim()) {
        showToast('Vui lòng nhập lý do từ chối', 'error');
        return;
      }
      rejectReason = reason.trim();
    }

    const confirmed = confirm(
      status === 'active'
        ? `Duyệt ${selectedPropertyIds.length} tin đã chọn?`
        : `Từ chối ${selectedPropertyIds.length} tin đã chọn?`
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      await apiBulkUpdatePropertyStatus({
        ids: selectedPropertyIds,
        status,
        reject_reason: rejectReason || undefined,
      });
      showToast(
        status === 'active'
          ? `Đã duyệt hàng loạt ${selectedPropertyIds.length} tin`
          : `Đã từ chối hàng loạt ${selectedPropertyIds.length} tin`
      );
      setSelectedPropertyIds([]);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật hàng loạt', 'error');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      await apiDeleteProperty(id);
      await fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // ── Subscription actions ───────────────────────────────────────────────────
  const handleApproveSubscription = async (sub: ApiSubscription) => {
    if (!confirm(`Xác nhận duyệt gói "${sub.plan_label}" cho ${sub.user_name}?\n\nTài khoản sẽ được nâng cấp ngay lập tức.`)) return;
    setProcessingId(sub.id);
    try {
      await apiUpdateSubscriptionStatus(sub.id, 'active', 'Đã xác nhận thanh toán và kích hoạt dịch vụ.');
      showToast(`✅ Đã duyệt và kích hoạt gói ${sub.plan_label} cho ${sub.user_name}!`);
      await fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi duyệt gói', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubscription = async (sub: ApiSubscription) => {
    const reason = prompt(`Lý do từ chối yêu cầu của ${sub.user_name} (tuỳ chọn):`);
    if (reason === null) return; // cancelled
    setProcessingId(sub.id);
    try {
      await apiUpdateSubscriptionStatus(sub.id, 'rejected', reason || 'Yêu cầu không hợp lệ.');
      showToast(`❌ Đã từ chối yêu cầu của ${sub.user_name}.`);
      await fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi từ chối', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingSubCount = subscriptions.filter(s => s.status === 'pending').length;

  const stats = [
    {
      label: 'Tổng người dùng',
      value: users.length.toString(),
      trend: '+12%',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Tin đăng chờ duyệt',
      value: properties.filter((p) => p.status === 'pending').length.toString(),
      trend: '+5%',
      icon: <Home className="w-5 h-5 text-orange-600" />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Gói chờ xác nhận',
      value: pendingSubCount.toString(),
      trend: pendingSubCount > 0 ? `+${pendingSubCount}` : '0',
      icon: <Package className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Doanh thu tháng',
      value: '1.2B',
      trend: '-2%',
      icon: <BarChart3 className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-50',
    },
  ];

  const filteredSubs = subFilter === 'all'
    ? subscriptions
    : subscriptions.filter((s) => s.status === subFilter);

  const visibleProperties = properties.filter((p) => {
    const q = propSearch.trim().toLowerCase();
    const statusMatch = propertyStatusFilter === 'all' || p.status === propertyStatusFilter;
    const searchMatch = !q || (p.title || '').toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q);
    const created = new Date(p.created_at);
    const fromMatch = !propertyFromDate || created >= new Date(`${propertyFromDate}T00:00:00`);
    const toMatch = !propertyToDate || created <= new Date(`${propertyToDate}T23:59:59`);
    return statusMatch && searchMatch && fromMatch && toMatch;
  });

  const selectableProperties = visibleProperties.filter(p => p.status === 'pending');
  const allVisibleSelected = selectableProperties.length > 0 && selectableProperties.every((p) => selectedPropertyIds.includes(p.id));
  const selectedCount = selectedPropertyIds.length;

  const togglePropertySelection = (id: number) => {
    setSelectedPropertyIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedPropertyIds((prev) => prev.filter((id) => !selectableProperties.some((p) => p.id === id)));
      return;
    }
    setSelectedPropertyIds((prev) => Array.from(new Set([...prev, ...selectableProperties.map((p) => p.id)])));
  };

  const visibleUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / 15);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 py-4 mt-4 border-t border-gray-100">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="rounded-xl">Trước</Button>
        <span className="text-sm font-medium text-gray-600">Trang {currentPage} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="rounded-xl">Sau</Button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold transition-all',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Quản trị hệ thống</h1>
          <p className="text-gray-500">Chào mừng trở lại, Quản trị viên</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl" onClick={() => setFilterOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Lọc dữ liệu
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Property detail modal */}
      {viewingProperty && (
        <div className="fixed inset-0 z-[180] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chi tiết tin đăng</h3>
                <p className="text-xs text-gray-500 mt-1">ID: #{viewingProperty.id}</p>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setViewingProperty(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                <img
                  src={viewingProperty.images?.[0] || 'https://via.placeholder.com/800x600?text=No+Image'}
                  alt={viewingProperty.title}
                  className="w-full h-64 rounded-2xl object-cover border border-gray-100"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Tiêu đề</p>
                  <p className="text-lg font-bold text-gray-900">{viewingProperty.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Loại</p>
                    <p className="font-semibold text-gray-800">{viewingProperty.type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Giá</p>
                    <p className="font-semibold text-blue-600">{viewingProperty.price} triệu</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Diện tích</p>
                    <p className="font-semibold text-gray-800">{viewingProperty.area} m2</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Trạng thái</p>
                    <span className={cn(
                      'inline-flex px-2 py-1 rounded-lg text-[11px] font-bold uppercase',
                      viewingProperty.status === 'active' ? 'bg-green-50 text-green-600' :
                      viewingProperty.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                      viewingProperty.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-gray-50 text-gray-600'
                    )}>
                      {viewingProperty.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Địa chỉ</p>
                  <p className="font-medium text-gray-800">{viewingProperty.address}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Người đăng</p>
                  <p className="font-medium text-gray-800">{viewingProperty.owner_name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{viewingProperty.owner_email || 'N/A'}</p>
                </div>

                {viewingProperty.reject_reason && (
                  <div className="p-3 rounded-xl border border-red-100 bg-red-50">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Lý do từ chối</p>
                    <p className="text-sm text-red-700">{viewingProperty.reject_reason}</p>
                  </div>
                )}
              </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <PropertyMortgage price={viewingProperty.price} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <Button variant="outline" className="rounded-xl" onClick={() => setViewingProperty(null)}>Đóng</Button>
              <Button className="bg-green-600 hover:bg-green-700 rounded-xl" onClick={async () => { await handleApprove(viewingProperty.id); setViewingProperty(null); }}>
                Duyệt tin
              </Button>
              <Button
                variant="outline"
                className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                onClick={async () => { await handleReject(viewingProperty.id); setViewingProperty(null); }}
              >
                Từ chối tin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lọc dữ liệu</h3>
                <p className="text-xs text-gray-500 mt-1">Áp dụng cho tin đăng (server-side) và danh sách người dùng (tìm kiếm nhanh).</p>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setFilterOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Từ ngày</label>
                  <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đến ngày</label>
                  <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Trạng thái (tin đăng / gói / role)</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả</option>
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="sold">sold</option>
                    <option value="rejected">rejected</option>
                    <option value="cancelled">cancelled</option>
                    <option value="admin">admin</option>
                    <option value="agent">agent</option>
                    <option value="user">user</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Loại (BĐS / gói)</label>
                  <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả</option>
                    <option value="apartment">apartment</option>
                    <option value="house">house</option>
                    <option value="land">land</option>
                    <option value="villa">villa</option>
                    <option value="basic">basic</option>
                    <option value="professional">professional</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Từ khoá</label>
                  <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Tiêu đề / địa chỉ / email..." className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <Button variant="outline" className="rounded-xl" onClick={resetFilters}>Xoá lọc</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setFilterOpen(false)}>Đóng</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={applyFilters}>Áp dụng</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Xuất báo cáo</h3>
                <p className="text-xs text-gray-500 mt-1">Xuất CSV theo bộ lọc hiện tại.</p>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setExportOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Loại báo cáo</label>
                <select value={reportEntity} onChange={(e) => setReportEntity(e.target.value as any)} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="properties">Tin đăng (properties)</option>
                  <option value="users">Người dùng (users)</option>
                  <option value="subscriptions">Gói dịch vụ (subscriptions)</option>
                </select>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-xs text-gray-600 space-y-1">
                <div><strong>Bộ lọc</strong>: {filters.from || '—'} → {filters.to || '—'}</div>
                <div><strong>status</strong>: {filters.status || '—'} · <strong>type</strong>: {filters.type || '—'}</div>
                <div><strong>search</strong>: {filters.search || '—'}</div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setExportOpen(false)}>Đóng</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={doExport} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                {exporting ? 'Đang xuất...' : 'Tải CSV'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit flex-wrap">
        {[
          { id: 'overview',       label: 'Tổng quan',    icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'properties',     label: 'Tin đăng',     icon: <Home className="w-4 h-4" /> },
          { id: 'users',          label: 'Người dùng',   icon: <Users className="w-4 h-4" /> },
          {
            id: 'subscriptions',
            label: 'Gói dịch vụ',
            icon: <Package className="w-4 h-4" />,
            badge: pendingSubCount > 0 ? pendingSubCount : undefined,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn('p-3 rounded-2xl', stat.bg)}>{stat.icon}</div>
                    <div className={cn(
                      'flex items-center text-xs font-bold px-2 py-1 rounded-lg',
                      stat.trend.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    )}>
                      {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visual dashboard */}
          <Card className="border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Dashboard trực quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarketDashboard />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Properties */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tin đăng mới chờ duyệt</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab('properties')}>
                  Xem tất cả
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.filter((p) => p.status === 'pending').slice(0, 5).map((prop) => (
                    <div key={prop.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-blue-100 transition-colors">
                      <img src={prop.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{prop.title}</h4>
                        <p className="text-xs text-gray-500">{prop.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" onClick={() => handleApprove(prop.id)} title="Duyệt tin">
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(prop.id)} title="Từ chối">
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {properties.filter((p) => p.status === 'pending').length === 0 && (
                    <div className="text-center py-10 text-gray-500">Không có tin đăng nào chờ duyệt.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Subscriptions quick view */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Gói chờ duyệt
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab('subscriptions')}>
                  Xem tất cả
                </Button>
              </CardHeader>
              <CardContent>
                {pendingSubCount === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Không có yêu cầu gói nào chờ duyệt
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.filter(s => s.status === 'pending').slice(0, 5).map((sub) => {
                      const pm = planMeta[sub.plan_name] ?? planMeta.basic;
                      return (
                        <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-50 bg-orange-50/30">
                          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden', pm.bg, pm.color)}>
                            {sub.user_photo
                              ? <img src={sub.user_photo} className="w-full h-full object-cover" alt="" />
                              : sub.user_name?.charAt(0)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{sub.user_name}</p>
                            <p className="text-xs text-gray-500">{pm.label}</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-auto rounded-lg"
                            onClick={() => handleApproveSubscription(sub)}
                            disabled={processingId === sub.id}
                          >
                            Duyệt
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── PROPERTIES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'properties' && (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle>Tất cả tin đăng ({visibleProperties.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin đăng..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={propertyStatusFilter}
                onChange={(e) => setPropertyStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="active">Đã duyệt</option>
                <option value="sold">Đã bán</option>
                <option value="rejected">Từ chối</option>
              </select>
              <input
                type="date"
                value={propertyFromDate}
                onChange={(e) => setPropertyFromDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={propertyToDate}
                onChange={(e) => setPropertyToDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setPropertyStatusFilter('all');
                  setPropertyFromDate('');
                  setPropertyToDate('');
                  setSelectedPropertyIds([]);
                }}
              >
                Xóa lọc
              </Button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                Chọn tất cả trong danh sách lọc
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Đã chọn: {selectedCount}</span>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 rounded-xl"
                  disabled={selectedCount === 0 || bulkUpdating}
                  onClick={() => handleBulkPropertyStatus('active')}
                >
                  {bulkUpdating ? 'Đang xử lý...' : 'Duyệt hàng loạt'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  disabled={selectedCount === 0 || bulkUpdating}
                  onClick={() => handleBulkPropertyStatus('rejected')}
                >
                  Từ chối hàng loạt
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 font-bold text-gray-500 text-xs uppercase tracking-wider w-10"></th>
                    <th className="pb-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Bất động sản</th>
                    <th className="pb-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Giá</th>
                    <th className="pb-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="pb-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Ngày đăng</th>
                    <th className="pb-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleProperties.slice((currentPage - 1) * 15, currentPage * 15).map((prop) => (
                    <tr key={prop.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        {prop.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedPropertyIds.includes(prop.id)}
                            onChange={() => togglePropertySelection(prop.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                          />
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={prop.images[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                          <div>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{prop.title}</p>
                            <p className="text-[10px] text-gray-500">{prop.type}</p>
                            {prop.status === 'rejected' && prop.reject_reason && (
                              <p className="text-[11px] text-red-600 mt-1">Lý do: {prop.reject_reason}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-bold text-blue-600">{prop.price} triệu</span>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-bold uppercase',
                          prop.status === 'active' ? 'bg-green-50 text-green-600' :
                          prop.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'
                        )}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-gray-500">
                        {new Date(prop.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setViewingProperty(prop)}
                            title="Xem tin"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem
                          </Button>
                          {prop.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:bg-green-50 rounded-lg"
                                onClick={() => handleApprove(prop.id)}
                                title="Duyệt tin"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Duyệt
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 rounded-lg"
                                onClick={() => handleReject(prop.id)}
                                title="Từ chối tin"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Từ chối
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(visibleProperties.length)}
          </CardContent>
        </Card>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Danh sách người dùng ({visibleUsers.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleUsers.slice((currentPage - 1) * 15, currentPage * 15).map((u) => (
                <div key={u.id} className="p-6 rounded-3xl border border-gray-100 hover:border-blue-100 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold overflow-hidden">
                      {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover" alt="" /> : u.display_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{u.display_name}</h4>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-gray-700 uppercase">{u.role}</span>
                    </div>
                    {u.role !== 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl"
                        onClick={() => onNavigate?.('admin-users')}
                      >
                        Thiết lập
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination(visibleUsers.length)}
          </CardContent>
        </Card>
      )}

      {/* ── SUBSCRIPTIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'pending',   label: 'Chờ duyệt',     icon: <Clock className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50' },
              { key: 'active',    label: 'Đang hoạt động', icon: <BadgeCheck className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
              { key: 'rejected',  label: 'Từ chối',        icon: <Ban className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
              { key: 'all',       label: 'Tổng cộng',      icon: <Package className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSubFilter(item.key as any)}
                className={cn(
                  'p-4 rounded-2xl text-left transition-all',
                  subFilter === item.key ? 'ring-2 ring-blue-500' : 'hover:shadow-md',
                  item.bg
                )}
              >
                <div className="mb-2">{item.icon}</div>
                <p className="text-2xl font-bold text-gray-900">
                  {item.key === 'all'
                    ? subscriptions.length
                    : subscriptions.filter(s => s.status === item.key).length}
                </p>
                <p className="text-xs font-medium text-gray-600">{item.label}</p>
              </button>
            ))}
          </div>

          {/* Subscriptions list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Yêu cầu đăng ký gói dịch vụ
                {pendingSubCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingSubCount} chờ duyệt
                  </span>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubscriptions}
                disabled={subLoading}
                className="rounded-xl"
              >
                {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Làm mới'}
              </Button>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  <span>Đang tải...</span>
                </div>
              ) : filteredSubs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Không có yêu cầu nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubs.slice((currentPage - 1) * 15, currentPage * 15).map((sub) => {
                    const pm = planMeta[sub.plan_name] ?? planMeta.basic;
                    const sm = statusMeta[sub.status] ?? statusMeta.pending;
                    const isPending    = sub.status === 'pending';
                    const isProcessing = processingId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border transition-all',
                          isPending
                            ? 'border-orange-100 bg-orange-50/30 hover:border-orange-200'
                            : 'border-gray-100 hover:border-gray-200'
                        )}
                      >
                        {/* Avatar + user info */}
                        <div className="flex items-center gap-4 flex-grow">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700 text-xl font-bold overflow-hidden flex-shrink-0">
                            {sub.user_photo
                              ? <img src={sub.user_photo} className="w-full h-full object-cover" alt="" />
                              : sub.user_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900">{sub.user_name}</p>
                            <p className="text-xs text-gray-500 truncate">{sub.user_email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', pm.bg, pm.color)}>
                                {pm.icon}
                                {pm.label}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600 font-medium">{sub.price_vnd}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {sub.payment_method === 'qr_transfer' ? 'Chuyển khoản QR'
                                  : sub.payment_method === 'credit_card' ? 'Thẻ tín dụng'
                                  : 'Liên hệ trực tiếp'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="text-xs text-gray-400 flex-shrink-0 hidden lg:block">
                          <div>{new Date(sub.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          {sub.note && (
                            <div className="mt-1 italic max-w-[160px] truncate" title={sub.note}>{sub.note}</div>
                          )}
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={cn('px-3 py-1 rounded-full text-xs font-bold', sm.bg, sm.color)}>
                            {sm.label}
                          </span>
                          {isPending && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl h-9 font-bold flex items-center gap-1"
                                onClick={() => handleApproveSubscription(sub)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 px-4 rounded-xl h-9 font-bold flex items-center gap-1"
                                onClick={() => handleRejectSubscription(sub)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Từ chối
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {filteredSubs.length > 0 && renderPagination(filteredSubs.length)}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
