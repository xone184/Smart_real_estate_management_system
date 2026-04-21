import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { User, Settings, List, Heart, Bell, LogOut, ShieldCheck, Clock, MapPin, ArrowRight, Trash2, Camera, Lock, Save, CheckCircle2, CalendarClock, Calendar as CalendarIcon, Phone, Package, Zap, Sparkles, Shield, BadgeCheck, Ban } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Avatar } from '../shared/Avatar';
import { apiGetProperties, apiGetSavedProperties, apiUnsaveProperty, apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead, apiUpdateUser, ApiNotification, apiGetAppointments, ApiAppointment, apiUpdateAppointmentStatus, apiBulkUpdateAppointmentStatus, apiUploadImages, apiDeleteProperty, apiUpdateProperty, apiGetMySubscriptions, apiCancelSubscription, ApiSubscription } from '../../services/api';
import { Property, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

type DashboardTab = 'profile' | 'listings' | 'saved' | 'appointments' | 'notifications' | 'settings' | 'subscription';

interface UserDashboardProps {
  initialTab?: DashboardTab;
  onNavigate?: (page: string) => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export function UserDashboard({ initialTab, onNavigate, user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab ?? 'profile');
  const [selectedNotification, setSelectedNotification] = useState<ApiNotification | null>(null);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [userListings, setUserListings] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [settingsName, setSettingsName] = useState(user?.display_name || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirm, setSettingsConfirm] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Appointments UI state
  const [aptFrom, setAptFrom] = useState('');
  const [aptTo, setAptTo] = useState('');
  const [aptShowOverdue, setAptShowOverdue] = useState(false);
  const [aptStatusFilter, setAptStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [selectedAptIds, setSelectedAptIds] = useState<number[]>([]);
  const [bulkConfirming, setBulkConfirming] = useState(false);

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Bất động sản này? Dữ liệu không thể phục hồi.')) return;
    try {
      await apiDeleteProperty(id);
      setUserListings(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      alert('Không thể xóa: ' + error.message);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setSettingsMsg(null);
    try {
      const res = await apiUploadImages([file], 'users');
      if (res.urls && res.urls.length > 0) {
        await apiUpdateUser(user.id, { photo_url: res.urls[0] });
        setSettingsMsg({ text: 'Tải ảnh thành công. Vui lòng Tải lại trang Hoặc Đăng xuất để thấy kết quả.', ok: true });
        // NOTE: Mặc dù update trên CSDL nhưng thông tin session hiển thị user sẽ cần context mới hoặc reload.
      }
    } catch (err: any) {
      setSettingsMsg({ text: err.message || 'Lỗi tải ảnh', ok: false });
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setSettingsName(user.display_name || '');
    fetchData();
  }, [user]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [listingsData, savedData, notiData, aptData, subData] = await Promise.all([
        apiGetProperties({ owner_id: user.id }),
        apiGetSavedProperties().catch(() => []),
        apiGetNotifications().catch(() => ({ notifications: [], unread_count: 0 })),
        apiGetAppointments().catch(() => []),
        apiGetMySubscriptions().catch(() => []),
      ]);
      setUserListings(listingsData as Property[]);
      setSavedProperties(savedData as Property[]);
      setNotifications(notiData.notifications);
      setAppointments(aptData as ApiAppointment[]);
      setSubscriptions(subData);
      setUnreadCount(notiData.unread_count);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Khi refresh appointments, xoá lựa chọn (tránh chọn sai)
    setSelectedAptIds([]);
  }, [appointments.length]);

  const handleUnsave = async (propertyId: number) => {
    try {
      await apiUnsaveProperty(propertyId);
      setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Unsave error:', error);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleOpenNotification = async (noti: ApiNotification) => {
    if (!noti.is_read) {
      await handleMarkRead(noti.id);
      noti = { ...noti, is_read: true };
    }
    setSelectedNotification(noti);
  };

  const closeNotificationModal = () => setSelectedNotification(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);

    if (settingsPassword && settingsPassword !== settingsConfirm) {
      setSettingsMsg({ text: 'Mật khẩu xác nhận không khớp', ok: false });
      return;
    }
    if (settingsPassword && settingsPassword.length < 6) {
      setSettingsMsg({ text: 'Mật khẩu phải có ít nhất 6 ký tự', ok: false });
      return;
    }

    setSettingsSaving(true);
    try {
      const updates: any = { display_name: settingsName };
      if (settingsPassword) updates.password = settingsPassword;
      await apiUpdateUser(user!.id, updates);
      setSettingsMsg({ text: 'Cập nhật thông tin thành công!', ok: true });
      setSettingsPassword('');
      setSettingsConfirm('');
    } catch (error: any) {
      setSettingsMsg({ text: error.message || 'Có lỗi xảy ra', ok: false });
    } finally {
      setSettingsSaving(false);
    }
  };

  const stats = [
    { label: 'Tin đã đăng', value: userListings.length.toString(), icon: <List className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Đã lưu', value: savedProperties.length.toString(), icon: <Heart className="w-4 h-4" />, color: 'bg-red-50 text-red-600' },
    { label: 'Lịch hẹn', value: appointments.length.toString(), icon: <CalendarClock className="w-4 h-4" />, color: 'bg-green-50 text-green-600' },
    { label: 'Thông báo', value: unreadCount.toString(), icon: <Bell className="w-4 h-4" />, color: 'bg-orange-50 text-orange-600' },
  ];

  const notiTypeStyles: Record<string, string> = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.color)}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* KYC Check */}
            {user && !user.kyc_verified && (
              <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Xác minh danh tính (KYC)</h4>
                      <p className="text-sm text-gray-500">Vui lòng xác minh danh tính để tăng uy tín và hạn mức giao dịch.</p>
                    </div>
                  </div>
                  <Button onClick={() => onNavigate?.('kyc')} className="bg-orange-600 hover:bg-orange-700 shrink-0">Xác minh ngay</Button>
                </CardContent>
              </Card>
            )}

            {user?.kyc_verified && (
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900">Danh tính đã được xác minh</h4>
                    <p className="text-sm text-green-700">Tài khoản của bạn được đánh dấu tin cậy trên hệ thống.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tin đăng gần đây</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab('listings')}>Xem tất cả</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userListings.length > 0 ? (
                    userListings.slice(0, 3).map((prop) => (
                      <ListingItem key={prop.id} property={prop} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>Bạn chưa có tin đăng nào.</p>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNavigate?.('post')}>
                        Đăng tin ngay
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'listings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý tin đăng ({userListings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {userListings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Chưa có tin đăng nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userListings.map((prop) => (
                    <ListingItem 
                      key={prop.id} 
                      property={prop} 
                      showActions 
                      onEdit={() => setEditingProperty(prop)}
                      onDelete={() => handleDeleteListing(prop.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'saved':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tin đã lưu ({savedProperties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {savedProperties.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Chưa có BĐS nào được lưu.</p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNavigate?.('home')}>
                    Khám phá BĐS
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedProperties.map((prop) => (
                    <motion.div
                      key={prop.id}
                      layout
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                    >
                      <img src={prop.images[0]} className="w-full h-48 object-cover" alt="" />
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa bất động sản này khỏi danh sách yêu thích?')) {
                              handleUnsave(prop.id);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 hover:bg-red-50 shadow transition-all"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{prop.title}</h4>
                        <div className="flex items-center text-gray-500 text-xs mb-3">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="line-clamp-1">{prop.address}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 font-bold">{prop.price >= 1000 ? `${(prop.price/1000).toFixed(1)} tỷ` : `${prop.price} triệu`}</span>
                          <span className="text-xs text-gray-400">{prop.area} m²</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'appointments':
        const parseDate = (d: string) => {
          if (!d) return null;
          const dt = new Date(`${d}T00:00:00`);
          return isNaN(dt.getTime()) ? null : dt;
        };
        const fromDt = parseDate(aptFrom);
        const toDt = parseDate(aptTo);

        const filteredAppointments = appointments.filter((apt) => {
          if (user && apt.user_id !== user.id && apt.owner_id !== user.id) return false;
          if (aptStatusFilter !== 'all' && apt.status !== aptStatusFilter) return false;
          if (aptShowOverdue && !(apt.is_overdue && apt.status === 'pending')) return false;
          const vdt = parseDate(apt.visit_date);
          if (fromDt && vdt && vdt < fromDt) return false;
          if (toDt && vdt && vdt > toDt) return false;
          return true;
        });

        const ownerPending = filteredAppointments.filter((apt) => apt.owner_id === user?.id && apt.status === 'pending');
        const allOwnerPendingIds = ownerPending.map((a) => a.id);
        const isAllSelected = allOwnerPendingIds.length > 0 && allOwnerPendingIds.every((id) => selectedAptIds.includes(id));
        const selectedOwnerPendingIds = selectedAptIds.filter((id) => allOwnerPendingIds.includes(id));

        const toggleSelect = (id: number) => {
          setSelectedAptIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
        };
        const toggleSelectAll = () => {
          setSelectedAptIds((prev) => {
            if (isAllSelected) return prev.filter((id) => !allOwnerPendingIds.includes(id));
            const set = new Set(prev);
            allOwnerPendingIds.forEach((id) => set.add(id));
            return Array.from(set);
          });
        };

        const bulkConfirm = async () => {
          if (selectedOwnerPendingIds.length === 0) return;
          if (!window.confirm(`Xác nhận ${selectedOwnerPendingIds.length} lịch hẹn đã chọn?`)) return;
          setBulkConfirming(true);
          try {
            await apiBulkUpdateAppointmentStatus(selectedOwnerPendingIds, 'confirmed');
            await fetchData();
          } catch (err: any) {
            alert('Không thể xác nhận hàng loạt: ' + (err.message || 'Lỗi'));
          } finally {
            setBulkConfirming(false);
          }
        };

        return (
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Lịch hẹn xem nhà ({filteredAppointments.length})</CardTitle>
                <div className="flex items-center gap-2">
                  {allOwnerPendingIds.length > 0 && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={bulkConfirming || selectedOwnerPendingIds.length === 0}
                      onClick={bulkConfirm}
                    >
                      {bulkConfirming ? 'Đang xác nhận...' : `Xác nhận hàng loạt (${selectedOwnerPendingIds.length})`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Từ ngày</label>
                  <input type="date" value={aptFrom} onChange={(e) => setAptFrom(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đến ngày</label>
                  <input type="date" value={aptTo} onChange={(e) => setAptTo(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Trạng thái</label>
                  <select value={aptStatusFilter} onChange={(e) => setAptStatusFilter(e.target.value as any)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã chốt lịch</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
                    <input type="checkbox" className="w-4 h-4" checked={aptShowOverdue} onChange={(e) => setAptShowOverdue(e.target.checked)} />
                    Quá hạn
                  </label>
                </div>
              </div>

              {/* Bulk selection row for owner pending */}
              {allOwnerPendingIds.length > 0 && (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <input type="checkbox" className="w-4 h-4" checked={isAllSelected} onChange={toggleSelectAll} />
                    Chọn tất cả lịch hẹn chờ xác nhận (của bạn)
                  </label>
                  <button
                    onClick={() => {
                      setAptFrom('');
                      setAptTo('');
                      setAptShowOverdue(false);
                      setAptStatusFilter('all');
                      setSelectedAptIds([]);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Reset bộ lọc
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Không có lịch hẹn phù hợp.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((apt) => {
                    const isOwner = apt.owner_id === user?.id;
                    const isOverdue = !!apt.is_overdue && apt.status === 'pending';
                    const canSelect = isOwner && apt.status === 'pending';
                    return (
                      <div key={apt.id} className="border border-gray-100 rounded-2xl p-4 md:p-6 bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {canSelect && (
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={selectedAptIds.includes(apt.id)}
                                onChange={() => toggleSelect(apt.id)}
                              />
                            )}
                            <span className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase",
                              isOverdue ? 'bg-red-100 text-red-700' :
                              apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            )}>
                              {isOverdue ? 'Quá hạn' :
                               apt.status === 'pending' ? 'Chờ xác nhận' :
                               apt.status === 'confirmed' ? 'Đã chốt lịch' :
                               apt.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-semibold",
                              isOwner ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            )}>
                              {isOwner ? 'Chủ nhà' : 'Khách hẹn xem nhà'}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-gray-900 line-clamp-1">{apt.property_title}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 flex-none py-1.5 rounded-lg">
                              <CalendarIcon className="w-4 h-4" />
                              <span className="font-bold">{apt.visit_date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg flex-none">
                              <Clock className="w-4 h-4" />
                              {apt.time_slot}
                            </div>
                          </div>
                          <div className="text-sm border-t border-gray-50 pt-3 mt-3">
                            <span className="text-gray-400 mr-2">{isOwner ? 'Người đăng ký:' : 'Chủ nhà:'}</span>
                            <span className="font-semibold text-gray-700">{isOwner ? apt.visitor_name : apt.owner_name}</span>
                          </div>
                          {apt.message && (
                            <p className="text-sm italic text-gray-500 bg-gray-50 p-2 rounded block mt-2">"{apt.message}"</p>
                          )}
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-100">
                          {isOwner && apt.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 w-full"
                              onClick={async () => {
                                await apiUpdateAppointmentStatus(apt.id, 'confirmed');
                                fetchData();
                              }}
                            >
                              Xác nhận lịch
                            </Button>
                          )}
                          {(apt.status === 'pending' || apt.status === 'confirmed') && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                              onClick={async () => {
                                if (confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
                                  await apiUpdateAppointmentStatus(apt.id, 'cancelled');
                                  fetchData();
                                }
                              }}
                            >
                              Hủy lịch hẹn
                            </Button>
                          )}
                           {isOwner && apt.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                await apiUpdateAppointmentStatus(apt.id, 'completed');
                                fetchData();
                              }}
                            >
                              Đã xem xong
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
                )}
              </CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={handleMarkAllRead}>
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Không có thông báo nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((noti) => (
                    <div
                      key={noti.id}
                      onClick={() => handleOpenNotification(noti)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer",
                        noti.is_read ? "bg-white border-gray-100" : "bg-blue-50/60 border-blue-100"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", notiTypeStyles[noti.type] || 'bg-blue-500')} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 text-sm">{noti.title}</h4>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                              {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{noti.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Cập nhật thông tin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                    <Avatar
                      src={user?.photo_url}
                      name={user?.display_name}
                      size={20}
                      className="rounded-2xl border-2 border-blue-200"
                    />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploadingAvatar ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    </label>
                  </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</p>
                      <p className="text-xs text-gray-400">Định dạng JPEG, PNG, WEBP. Tối đa 5MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                      <input
                        type="text"
                        value={settingsName}
                        onChange={e => setSettingsName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Lock className="w-3.5 h-3.5 inline mr-1" />
                        Mật khẩu mới (để trống nếu không đổi)
                      </label>
                      <input
                        type="password"
                        value={settingsPassword}
                        onChange={e => setSettingsPassword(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={settingsConfirm}
                        onChange={e => setSettingsConfirm(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {settingsMsg && (
                    <div className={cn(
                      "p-3 rounded-xl text-sm font-medium",
                      settingsMsg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {settingsMsg.ok && <CheckCircle2 className="w-4 h-4 inline mr-1.5" />}
                      {settingsMsg.text}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={settingsSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8 rounded-xl font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {settingsSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Phân quyền & KYC */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  Xác minh & Bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-medium text-gray-900">Xác minh KYC</p>
                    <p className="text-sm text-gray-500">
                      {user?.kyc_verified ? 'Danh tính đã được xác minh' : 'Chưa xác minh danh tính'}
                    </p>
                  </div>
                  {user?.kyc_verified ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                      <CheckCircle2 className="w-4 h-4" /> Đã xác minh
                    </span>
                  ) : (
                    <Button onClick={() => onNavigate?.('kyc')} className="bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-xl">
                      Xác minh ngay
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-medium text-gray-900">Vai trò tài khoản</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role || 'user'}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-xl",
                    user?.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                    user?.role === 'agent' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                    'bg-blue-50 text-blue-600 border border-blue-100'
                  )}>
                    {user?.role?.toUpperCase() || 'USER'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'subscription': {
        const planMeta: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
          basic:        { label: 'Cơ bản',         icon: <Shield className="w-5 h-5" />,   color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200'  },
          professional: { label: 'Chuyên nghiệp', icon: <Zap className="w-5 h-5" />,      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'  },
          enterprise:   { label: 'Doanh nghiệp',  icon: <Sparkles className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
        };
        const statusMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
          pending:   { label: 'Chờ quản trị viên xác nhận', icon: <Clock className="w-4 h-4" />,       color: 'text-orange-600' },
          active:    { label: 'Đang hoạt động',              icon: <BadgeCheck className="w-4 h-4" />,  color: 'text-green-600'  },
          rejected:  { label: 'Bị từ chối',                  icon: <Ban className="w-4 h-4" />,         color: 'text-red-600'    },
          cancelled: { label: 'Đã huỷ',                      icon: <Ban className="w-4 h-4" />,         color: 'text-gray-500'   },
        };
        const activeSub = subscriptions.find(s => s.status === 'active');
        const pendingSubs = subscriptions.filter(s => s.status === 'pending');

        return (
          <div className="space-y-6">
            {/* Current plan banner */}
            <Card className={cn('border-2 overflow-hidden', activeSub ? planMeta[activeSub.plan_name]?.border ?? 'border-blue-200' : 'border-gray-200')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', activeSub ? planMeta[activeSub.plan_name]?.bg ?? 'bg-blue-50' : 'bg-gray-50', activeSub ? planMeta[activeSub.plan_name]?.color ?? 'text-blue-600' : 'text-gray-400')}>
                      {activeSub ? (planMeta[activeSub.plan_name]?.icon ?? <Package className="w-5 h-5" />) : <Package className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Gói hiện tại</p>
                      <h3 className="text-xl font-bold text-gray-900">{activeSub ? planMeta[activeSub.plan_name]?.label ?? activeSub.plan_label : 'Cơ bản (Miễn phí)'}</h3>
                      {activeSub?.price_vnd && <p className="text-sm text-gray-500 mt-0.5">{activeSub.price_vnd}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSub && (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Đang hoạt động
                      </span>
                    )}
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      onClick={() => onNavigate?.('pricing')}
                    >
                      {activeSub?.plan_name === 'enterprise' ? 'Đã đạt gói cao nhất' : 'Nâng cấp gói'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending notice */}
            {pendingSubs.length > 0 && (
              <Card className="border-orange-100 bg-orange-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900 mb-1">Đang có yêu cầu chờ duyệt</h4>
                      <p className="text-sm text-orange-700">
                        Bạn đã đăng ký gói <strong>{pendingSubs[0].plan_label}</strong>. Quản trị viên sẽ xác nhận thanh toán và kích hoạt gói trong vòng 24 giờ.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Lịch sử đăng ký ({subscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">Bạn chưa đăng ký gói dịch vụ nào.</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNavigate?.('pricing')}>
                      Xem các gói dịch vụ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => {
                      const pm = planMeta[sub.plan_name] ?? planMeta.basic;
                      const sm = statusMeta[sub.status]  ?? statusMeta.pending;
                      return (
                        <div key={sub.id} className={cn('flex items-center gap-4 p-4 rounded-2xl border transition-all', pm.border)}>
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', pm.bg, pm.color)}>
                            {pm.icon}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900">{pm.label}</p>
                              <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', sm.color)}>
                                {sm.icon} {sm.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(sub.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                              {sub.approved_at && ` · Duyệt: ${new Date(sub.approved_at).toLocaleDateString('vi-VN')}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-blue-600 text-sm">{sub.price_vnd}</p>
                            {sub.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  if (!confirm('Huỷ yêu cầu đăng ký này?')) return;
                                  await apiCancelSubscription(sub.id).catch(() => {});
                                  fetchData();
                                }}
                                className="text-xs text-red-500 hover:text-red-700 mt-1 block"
                              >Huỷ yêu cầu</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-500" />
            <CardContent className="relative pt-12 text-center">
              <Avatar
                src={user?.photo_url}
                name={user?.display_name}
                size={24}
                className="absolute -top-12 left-1/2 -translate-x-1/2 border-4 border-white"
              />
              <h3 className="text-xl font-bold text-gray-900">{user?.display_name || 'Người dùng'}</h3>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                user?.kyc_verified
                  ? "bg-green-50 text-green-600 border-green-100"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              )}>
                <ShieldCheck className="w-3 h-3" />
                {user?.kyc_verified ? 'Đã xác minh KYC' : 'Chưa xác minh'}
              </div>
            </CardContent>
            <div className="border-t border-gray-100 p-2">
              <SidebarItem icon={<User className="w-4 h-4" />} label="Hồ sơ cá nhân" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <SidebarItem icon={<List className="w-4 h-4" />} label="Quản lý tin đăng" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
              <SidebarItem icon={<Heart className="w-4 h-4" />} label="Tin đã lưu" badge={savedProperties.length} active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} />
              <SidebarItem icon={<CalendarClock className="w-4 h-4" />} label="Lịch hẹn xem nhà" badge={appointments.length} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
              <SidebarItem icon={<Bell className="w-4 h-4" />} label="Thông báo" badge={unreadCount} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
              <SidebarItem icon={<Package className="w-4 h-4" />} label="Gói dịch vụ của tôi" active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} />
              <SidebarItem icon={<Settings className="w-4 h-4" />} label="Cài đặt tài khoản" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              <div className="my-2 border-t border-gray-100" />
              <SidebarItem icon={<LogOut className="w-4 h-4" />} label="Đăng xuất" className="text-red-600 hover:bg-red-50" onClick={onLogout} />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {editingProperty && (
        <EditPropertyModal 
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSuccess={() => {
            setEditingProperty(null);
            fetchData();
          }}
        />
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">{new Date(selectedNotification.created_at).toLocaleString('vi-VN')}</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedNotification.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeNotificationModal}
                className="text-gray-500 hover:text-gray-900"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 uppercase tracking-widest">{selectedNotification.type}</p>
              <p className="text-base text-gray-700 whitespace-pre-line">{selectedNotification.message}</p>
              {selectedNotification.link && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open(selectedNotification.link, '_blank')}
                >
                  Mở liên kết
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditPropertyModal({ property, onClose, onSuccess }: { property: Property; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: property.title,
    price: property.price,
    area: property.area,
    status: property.status,
    description: property.description || '',
    type: property.type || 'house',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    direction: property.direction || '',
    legal: property.legal || 'pink_book',
    address: property.address || '',
    legal_scan_url: property.legal_scan_url || '',
    planning_url: property.planning_url || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiUpdateProperty(property.id, formData);
      onSuccess();
    } catch (error: any) {
      alert('Lỗi cập nhật: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-full">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold">Chỉnh sửa chi tiết BĐS</h3>
          <button className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          <form id="edit-property-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Tiêu đề tin đăng</label>
              <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Loại BĐS</label>
                <select className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} required>
                  <option value="house">Nhà phố</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="land">Đất nền</option>
                  <option value="villa">Biệt thự</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Pháp lý</label>
                <select className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.legal} onChange={e => setFormData({...formData, legal: e.target.value})} required>
                    <option value="pink_book">Sổ hồng</option>
                    <option value="red_book">Sổ đỏ</option>
                    <option value="contract">Hợp đồng mua bán</option>
                    <option value="other">Giấy tờ khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Giá (Triệu VNĐ)</label>
                <input type="number" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Diện tích (m²)</label>
                <input type="number" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.area === 0 ? '' : formData.area} onChange={e => setFormData({...formData, area: Number(e.target.value)})} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phòng ngủ</label>
                <input type="number" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.bedrooms === 0 ? '' : formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phòng tắm</label>
                <input type="number" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.bathrooms === 0 ? '' : formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Hướng</label>
                <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Địa chỉ chi tiết</label>
              <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Link bản scan pháp lý</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={formData.legal_scan_url}
                  onChange={e => setFormData({...formData, legal_scan_url: e.target.value})}
                  placeholder="https://.../so-do-hoac-so-hong.pdf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Link quy hoạch khu vực</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={formData.planning_url}
                  onChange={e => setFormData({...formData, planning_url: e.target.value})}
                  placeholder="https://.../ban-do-quy-hoach"
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium mb-1 text-gray-700">Mô tả</label>
               <textarea rows={4} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Trạng thái giao dịch</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="pending">Đang chờ duyệt</option>
                <option value="active">Đang hiển thị</option>
                <option value="sold">Đã bán thành công</option>
                <option value="rejected">Tạm ẩn / Từ chối</option>
              </select>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" type="button" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button form="edit-property-form" className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold" type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu lại'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListingItem({ 
  property, 
  showActions,
  onEdit,
  onDelete
}: { 
  property: Property; 
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: 'Đang hiển thị', color: 'bg-green-50 text-green-600' },
    pending: { label: 'Đang chờ duyệt', color: 'bg-orange-50 text-orange-600' },
    sold: { label: 'Đã bán', color: 'bg-gray-50 text-gray-500' },
    rejected: { label: 'Bị từ chối', color: 'bg-red-50 text-red-600' },
  };
  const statusInfo = statusMap[property.status] || statusMap.pending;

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-blue-100 transition-colors group">
      <img
        src={property.images[0]}
        className="w-20 h-20 rounded-xl object-cover"
        alt=""
        referrerPolicy="no-referrer"
      />
      <div className="flex-grow">
        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{property.title}</h4>
        <p className="text-xs text-gray-500 mb-2">Đăng ngày: {new Date(property.created_at).toLocaleDateString('vi-VN')}</p>
        <div className="flex items-center gap-3">
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", statusInfo.color)}>{statusInfo.label}</span>
          <span className="text-blue-600 font-bold text-sm">
            {property.price >= 1000 ? `${(property.price / 1000).toFixed(1)} tỷ` : `${property.price} triệu`}
          </span>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onEdit}>Chỉnh sửa</Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="rounded-xl text-red-500 hover:bg-red-50 border-red-100 px-3">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, className, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  className?: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
        active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50",
        className
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
