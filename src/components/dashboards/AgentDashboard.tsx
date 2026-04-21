import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { User, Settings, List, Heart, Bell, LogOut, ShieldCheck, Clock, MapPin, ArrowRight, Trash2, Camera, Lock, Save, CheckCircle2, CalendarClock, Calendar as CalendarIcon, Phone, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Avatar } from '../shared/Avatar';
import { apiGetProperties, apiGetSavedProperties, apiUnsaveProperty, apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead, apiUpdateUser, ApiNotification, apiGetAppointments, ApiAppointment, apiUpdateAppointmentStatus, apiUploadImages, apiDeleteProperty, apiUpdateProperty, apiGetReviews, ApiReview } from '../../services/api';
import { Property, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';

type DashboardTab = 'profile' | 'listings' | 'saved' | 'appointments' | 'notifications' | 'settings';

interface AgentDashboardProps {
  initialTab?: DashboardTab;
  onNavigate?: (page: string) => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export function AgentDashboard({ initialTab, onNavigate, user, onLogout }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab ?? 'profile');
  const [selectedNotification, setSelectedNotification] = useState<ApiNotification | null>(null);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [userListings, setUserListings] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
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
      const [listingsData, savedData, notiData, aptData] = await Promise.all([
        apiGetProperties({ owner_id: user.id }),
        apiGetSavedProperties().catch(() => []),
        apiGetNotifications().catch(() => ({ notifications: [], unread_count: 0 })),
        apiGetAppointments().catch(() => []),
      ]);
      const listings = listingsData as Property[];
      setUserListings(listings);
      setSavedProperties(savedData as Property[]);
      setNotifications(notiData.notifications);
      setAppointments(aptData as ApiAppointment[]);
      setUnreadCount(notiData.unread_count);

      try {
        const reviewLists = await Promise.all(listings.map((prop) => apiGetReviews(prop.id).catch(() => [] as ApiReview[])));
        const totalReviews = reviewLists.reduce((sum, list) => sum + list.length, 0);
        const totalRating = reviewLists.reduce((sum, list) => sum + list.reduce((acc, review) => acc + (review.rating || 0), 0), 0);
        setReviewCount(totalReviews);
        setAvgRating(totalReviews > 0 ? totalRating / totalReviews : 0);
      } catch (err) {
        setReviewCount(0);
        setAvgRating(0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    { label: 'Tin BĐS quản lý', value: userListings.length.toString(), icon: <List className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Lượt đăng ký xem nhà', value: appointments.length.toString(), icon: <CalendarClock className="w-4 h-4" />, color: 'bg-green-50 text-green-600' },
    { label: 'Lượt đánh giá', value: reviewCount.toString(), icon: <Star className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Tin quan tâm', value: savedProperties.length.toString(), icon: <Heart className="w-4 h-4" />, color: 'bg-red-50 text-red-600' },
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

            {/* Dashboard charts */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Biểu đồ hoạt động</CardTitle>
                <p className="text-sm text-gray-500">Dữ liệu tổng hợp từ tin đăng, đặt lịch và đánh giá</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2 h-80 bg-white rounded-3xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Xu hướng tương tác</p>
                        <h3 className="text-lg font-semibold text-gray-900">So sánh chỉ số</h3>
                      </div>
                      <span className="text-xs text-gray-400">Tổng lượt hiện tại</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Tin đăng', value: userListings.length },
                        { name: 'Đặt lịch', value: appointments.length },
                        { name: 'Đánh giá', value: reviewCount },
                        { name: 'Tin quan tâm', value: savedProperties.length },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN')} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb">
                          {[
                            '#2563eb',
                            '#16a34a',
                            '#ca8a04',
                            '#ef4444',
                          ].map((color, index) => (
                            <Cell key={index} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <div className="h-80 bg-white rounded-3xl p-4 border border-gray-100">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Trạng thái tin đăng</p>
                        <h3 className="text-lg font-semibold text-gray-900">Phân bố tin</h3>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(userListings.reduce((acc, prop) => {
                              const status = prop.status || 'unknown';
                              acc[status] = (acc[status] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)).map(([key, value]) => ({
                              name: key === 'active' ? 'Đang hiển thị' : key === 'pending' ? 'Chờ duyệt' : key === 'rejected' ? 'Bị từ chối' : key === 'sold' ? 'Đã bán' : key,
                              value,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={40}
                            paddingAngle={3}
                          >
                            {Object.keys(userListings.reduce((acc, prop) => {
                              const status = prop.status || 'unknown';
                              acc[status] = (acc[status] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)).map((status, index) => (
                              <Cell key={status} fill={['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#6b7280'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN')} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-80 bg-white rounded-3xl p-4 border border-gray-100">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Đánh giá trung bình</p>
                        <h3 className="text-lg font-semibold text-gray-900">Chất lượng dịch vụ</h3>
                      </div>
                      <div className="h-full flex flex-col justify-center items-center text-center">
                        <span className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                        <p className="text-sm text-gray-500 mt-2">trên {reviewCount.toLocaleString('vi-VN')} lượt đánh giá</p>
                        <div className="mt-4 w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.round(avgRating * 20))}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
        const visibleAppointments = appointments.filter((apt) => user && (apt.owner_id === user.id || apt.user_id === user.id));
        return (
          <Card>
            <CardHeader>
              <CardTitle>Lịch hẹn xem nhà ({visibleAppointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {visibleAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Chưa có lịch hẹn nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleAppointments.map((apt) => {
                    const isOwner = apt.owner_id === user?.id;
                    return (
                      <div key={apt.id} className="border border-gray-100 rounded-2xl p-4 md:p-6 bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase",
                              apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            )}>
                              {apt.status === 'pending' ? 'Chờ xác nhận' :
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
              <h3 className="text-xl font-bold text-gray-900">{user?.display_name || 'Nhà môi giới (Agent)'}</h3>
              <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Pro Agent
              </div>
              <br/>
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
              <SidebarItem icon={<User className="w-4 h-4" />} label="Tổng quan" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              <SidebarItem icon={<List className="w-4 h-4" />} label="Quản lý giỏ hàng BĐS" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
              <SidebarItem icon={<Heart className="w-4 h-4" />} label="Quan tâm của tôi" badge={savedProperties.length} active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} />
              <SidebarItem icon={<CalendarClock className="w-4 h-4" />} label="Danh sách chốt khách" badge={appointments.length} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
              <SidebarItem icon={<Bell className="w-4 h-4" />} label="Thông báo" badge={unreadCount} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
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
