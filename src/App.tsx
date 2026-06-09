import React, { useState, useEffect } from 'react';
import { Navbar } from './components/shared/Navbar';
import { PropertyCard } from './components/property/PropertyCard';
import { PropertyStepper } from './components/property/PropertyStepper';
import { MarketDashboard } from './components/dashboards/MarketDashboard';
import { AIChatbot } from './components/shared/AIChatbot';
import { PropertyDetail } from './components/property/PropertyDetail';
import { PropertySearch } from './components/property/PropertySearch';
import { Pricing } from './components/pages/Pricing';
import { UserDashboard } from './components/dashboards/UserDashboard';
import { AgentDashboard } from './components/dashboards/AgentDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { KYCVerification } from './components/shared/KYCVerification';
import { PropertyComparison } from './components/property/PropertyComparison';
import { PropertyNotification } from './components/property/PropertyNotification';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { SearchResultsPage } from './components/pages/SearchResultsPage';
import { MessengerPage } from './components/pages/MessengerPage';
import AdminUserManagement from './components/pages/AdminUserManagementPage';
import { Property, UserProfile } from './types';
import { Search, MapPin, TrendingUp, Sparkles, ArrowRight, Home, Layers, LogIn, LogOut, Database, X } from 'lucide-react';
import { Button } from './components/shared/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { apiGetMe, apiLogin, apiRegister, apiLogout, apiGetProperties, apiSeedData, apiGetChatUnreadCount, apiSendOTP, apiVerifyOTP, AuthUser } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparisonList, setComparisonList] = useState<Property[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasAutoSeeded, setHasAutoSeeded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);
  const [chatDefaultReceiver, setChatDefaultReceiver] = useState<number | undefined>();
  const [savedPropertyIds, setSavedPropertyIds] = useState<number[]>([]);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'properties' | 'users' | 'subscriptions' | 'contacts'>('overview');


  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authRole, setAuthRole] = useState('user');

  // OTP verification state
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpTimerRef, setOtpTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

  // Check session on mount
  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  // Poll chat unread count every 10 s when user is logged in
  useEffect(() => {
    if (!user) { setChatUnread(0); return; }
    const fetchUnread = async () => {
      try {
        const res = await apiGetChatUnreadCount();
        setChatUnread(res.unread_count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Load saved properties
  useEffect(() => {
    import('./services/api').then(({ apiGetSavedProperties }) => {
      if (user) {
        apiGetSavedProperties().then(res => setSavedPropertyIds(res.map(r => r.id))).catch(() => {});
      } else {
        setSavedPropertyIds([]);
      }
    });
  }, [user]);

  // Auto seed khi chưa có dữ liệu
  useEffect(() => {
    if (user && !loading && properties.length === 0 && !isSeeding && !hasAutoSeeded) {
      setHasAutoSeeded(true);
      seedData();
    }
  }, [user, loading, properties.length, isSeeding, hasAutoSeeded]);

  // Route guard: không cho phép non-admin vào trang admin
  useEffect(() => {
    if (currentPage === 'admin' && user && user.role !== 'admin') {
      // Redirect về đúng dashboard của họ
      setCurrentPage('profile');
    }
  }, [currentPage, user]);


  const checkAuth = async () => {
    try {
      const res = await apiGetMe();
      if (res.user) {
        setUser(res.user as UserProfile);
        if ((window as any).NexusTracker) {
          (window as any).NexusTracker.identify(res.user.email, res.user.display_name);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await apiGetProperties({ status: 'active' });
      setProperties(data as Property[]);
    } catch (error) {
      console.error('Fetch properties failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiLogin(authEmail, authPassword);
      setUser(res.user as UserProfile);
      if ((window as any).NexusTracker) {
        (window as any).NexusTracker.identify(res.user.email, res.user.display_name);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      addNotification('Đăng nhập thành công', 'success');
      fetchProperties();
    } catch (error: any) {
      setAuthError(error.message || 'Đăng nhập thất bại');
    } finally {
      setAuthLoading(false);
    }
  };

  const startOtpCountdown = (seconds: number) => {
    if (otpTimerRef) clearInterval(otpTimerRef);
    setOtpCountdown(seconds);
    const interval = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    setOtpTimerRef(interval);
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiSendOTP(authEmail, authPassword, authName, authRole);
      setOtpMaskedEmail(res.masked_email);
      setOtpStep('otp');
      setOtpCode('');
      startOtpCountdown(res.expires_in);
    } catch (error: any) {
      setAuthError(error.message || 'Gửi mã xác thực thất bại');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    if (otpCode.length !== 6) {
      setAuthError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await apiVerifyOTP(authEmail, otpCode, authPassword, authName, authRole);
      setUser(res.user as UserProfile);
      if ((window as any).NexusTracker) {
        (window as any).NexusTracker.identify(res.user.email, res.user.display_name);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setOtpCode('');
      setOtpStep('form');
      if (otpTimerRef) clearInterval(otpTimerRef);
      addNotification('🎉 Đăng ký thành công! Chào mừng bạn đến với SmartRE.', 'success');
      fetchProperties();
    } catch (error: any) {
      setAuthError(error.message || 'Xác thực thất bại');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiSendOTP(authEmail, authPassword, authName, authRole);
      setOtpMaskedEmail(res.masked_email);
      setOtpCode('');
      startOtpCountdown(res.expires_in);
      addNotification('Đã gửi lại mã xác thực', 'info');
    } catch (error: any) {
      setAuthError(error.message || 'Gửi lại mã thất bại');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      setUser(null);
      addNotification('Đã đăng xuất', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const seedData = async () => {
    if (!user) {
      addNotification('Vui lòng đăng nhập để thực hiện', 'warning');
      return;
    }
    
    setIsSeeding(true);
    addNotification('Đang tự động chuẩn bị dữ liệu mẫu cho bạn...', 'info');

    try {
      await apiSeedData();
      await fetchProperties();
      addNotification('Hệ thống đã sẵn sàng với đầy đủ dữ liệu mẫu!', 'success');
      setCurrentPage('home');
    } catch (error) {
      console.error('Seed error:', error);
      addNotification('Lỗi khi chuẩn bị dữ liệu mẫu', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAdminNavigate = (tab: any) => {
    setAdminInitialTab(tab);
    setCurrentPage('admin');
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setCurrentPage('detail');
  };

  const toggleComparison = (property: Property) => {
    if (comparisonList.some(p => p.id === property.id)) {
      setComparisonList(comparisonList.filter(p => p.id !== property.id));
      addNotification(`Đã xóa ${property.title} khỏi danh sách so sánh`, 'info');
    } else if (comparisonList.length < 4) {
      setComparisonList([...comparisonList, property]);
      addNotification(`Đã thêm ${property.title} vào danh sách so sánh`, 'success');
    } else {
      addNotification('Bạn chỉ có thể so sánh tối đa 4 bất động sản cùng lúc', 'warning');
    }
  };

  const resetAuthModal = () => {
    setShowAuthModal(false);
    setOtpStep('form');
    setOtpCode('');
    setAuthError('');
    if (otpTimerRef) clearInterval(otpTimerRef);
    setOtpCountdown(0);
  };

  const handleToggleSaveGlobal = (propertyId: number, saved: boolean) => {
    setSavedPropertyIds(prev => 
      saved ? [...prev, propertyId] : prev.filter(id => id !== propertyId)
    );
    if (saved) {
      addNotification('Đã lưu bất động sản vào danh sách yêu thích', 'success');
    } else {
      addNotification('Đã xóa khỏi danh sách yêu thích', 'info');
    }
  };

  const renderAuthModal = () => (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={resetAuthModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button onClick={resetAuthModal} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              {otpStep === 'otp' ? (
                <>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h2 className="text-2xl font-bold">Xác thực email</h2>
                  <p className="text-blue-100 text-sm mt-1">Nhập mã 6 chữ số đã gửi đến email của bạn</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {authMode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                  </p>
                </>
              )}
            </div>

            {/* ── OTP Step ── */}
            {otpStep === 'otp' ? (
              <form onSubmit={handleVerifyOTP} className="p-6 space-y-5">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Mã xác thực đã được gửi đến</p>
                  <p className="font-bold text-gray-800 text-base">{otpMaskedEmail}</p>
                </div>

                {/* OTP Input Boxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Nhập mã xác thực</label>
                  <div className="flex justify-center gap-2">
                    {[0,1,2,3,4,5].map(i => (
                      <input
                        key={i}
                        id={`otp-input-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCode[i] || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const arr = otpCode.split('');
                          arr[i] = val.slice(-1);
                          const newCode = arr.join('').slice(0, 6);
                          setOtpCode(newCode);
                          // Auto-focus next
                          if (val && i < 5) {
                            const next = document.getElementById(`otp-input-${i+1}`) as HTMLInputElement;
                            next?.focus();
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                            const prev = document.getElementById(`otp-input-${i-1}`) as HTMLInputElement;
                            prev?.focus();
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                          setOtpCode(pasted);
                          const lastIdx = Math.min(pasted.length, 5);
                          const nextEl = document.getElementById(`otp-input-${lastIdx}`) as HTMLInputElement;
                          nextEl?.focus();
                        }}
                        className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
                        style={{
                          borderColor: otpCode[i] ? '#2563eb' : '#e5e7eb',
                          background: otpCode[i] ? '#eff6ff' : '#ffffff',
                          color: '#1e293b',
                        }}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown */}
                <div className="text-center text-sm text-gray-500">
                  {otpCountdown > 0 ? (
                    <span>Mã hết hạn sau <strong className="text-blue-600">{Math.floor(otpCountdown/60)}:{String(otpCountdown%60).padStart(2,'0')}</strong></span>
                  ) : (
                    <span className="text-red-500 font-medium">Mã đã hết hạn</span>
                  )}
                </div>

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium"
                  >
                    ❌ {authError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={authLoading || otpCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
                >
                  {authLoading ? 'Đang xác thực...' : '✅ Xác nhận & Đăng ký'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setOtpStep('form'); setOtpCode(''); setAuthError(''); if (otpTimerRef) clearInterval(otpTimerRef); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={otpCountdown > 0 || authLoading}
                    className={`font-medium transition-colors ${
                      otpCountdown > 0 ? 'text-gray-300 cursor-default' : 'text-blue-600 hover:text-blue-700 hover:underline'
                    }`}
                  >
                    {otpCountdown > 0 ? `Gửi lại sau ${otpCountdown}s` : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Login / Register Form ── */
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="p-6 space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài khoản</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setAuthRole('user')} className={`p-2 border rounded-xl text-sm font-medium transition-colors ${authRole === 'user' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Người Mua/Bán</button>
                      <button type="button" onClick={() => setAuthRole('agent')} className={`p-2 border rounded-xl text-sm font-medium transition-colors ${authRole === 'agent' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Nhà Môi giới</button>
                    </div>
                  </div>
                )}
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium"
                  >
                    {authError}
                  </motion.div>
                )}
                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
                >
                  {authLoading
                    ? (authMode === 'register' ? '⏳ Đang gửi mã xác thực...' : 'Đang xử lý...')
                    : authMode === 'login' ? 'Đăng nhập' : '📨 Gửi mã xác thực'}
                </Button>
                <div className="text-center text-sm text-gray-500">
                  {authMode === 'login' ? (
                    <>
                      Chưa có tài khoản?{' '}
                      <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); setOtpStep('form'); }} className="text-blue-600 font-bold hover:underline">
                        Đăng ký ngay
                      </button>
                    </>
                  ) : (
                    <>
                      Đã có tài khoản?{' '}
                      <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setOtpStep('form'); }} className="text-blue-600 font-bold hover:underline">
                        Đăng nhập
                      </button>
                    </>
                  )}
                </div>
                {authMode === 'login' && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-2">Tài khoản demo:</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setAuthEmail('admin@smartre.vn'); setAuthPassword('admin123'); }} className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-gray-600 font-medium transition-colors">Admin</button>
                      <button type="button" onClick={() => { setAuthEmail('user@smartre.vn'); setAuthPassword('user123'); }} className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-gray-600 font-medium transition-colors">User</button>
                      <button type="button" onClick={() => { setAuthEmail('agent@smartre.vn'); setAuthPassword('agent123'); }} className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-gray-600 font-medium transition-colors">Agent</button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-12 pb-20">
            {/* Quick Setup Banner for Empty State */}
            {user && properties.length === 0 && (
              <div className="max-w-[1440px] mx-auto px-4 mt-8">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Database className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-2">Chào mừng bạn đến với AI Real Estate!</h2>
                    <p className="text-blue-100 mb-6">
                      Để bạn có thể trải nghiệm đầy đủ các tính năng như Phân tích thị trường, Quản trị viên và Đánh giá, 
                      tôi đã chuẩn bị sẵn bộ dữ liệu mẫu chuyên nghiệp.
                    </p>
                    <Button 
                      onClick={seedData} 
                      disabled={isSeeding}
                      className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 h-auto rounded-2xl shadow-lg"
                    >
                      {isSeeding ? 'Đang thiết lập...' : 'Thiết lập dữ liệu mẫu ngay'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Section */}
            <section className="relative h-[480px] flex items-center justify-center overflow-hidden mx-4 sm:mx-0 shadow-xl">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://picsum.photos/seed/realestate-hero/1920/1080" 
                  className="w-full h-full object-cover brightness-50"
                  alt="Hero"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="relative z-10 text-center px-4 max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-md border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Hệ thống BĐS thông minh tích hợp AI
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
                    Tìm kiếm ngôi nhà <br /> <span className="text-blue-400">trong mơ</span> của bạn
                  </h1>
                  <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Khám phá hàng ngàn bất động sản với công nghệ AI định giá chính xác, 
                    tour 3D thực tế ảo và trợ lý ảo tư vấn 24/7.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* Search Section */}
            <PropertySearch onSearchNavigate={(term, filters) => {
              setSearchTerm(term);
              setSearchFilters(filters);
              setCurrentPage('search');
            }} />

            {/* Featured Listings */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Bất động sản nổi bật</h2>
                  <p className="text-gray-500">Những lựa chọn tốt nhất dành riêng cho bạn</p>
                </div>
                <div className="flex gap-4 items-center">
                  {user && properties.length === 0 && (
                    <Button onClick={seedData} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold">
                      Thêm dữ liệu mẫu
                    </Button>
                  )}
                  <Button variant="ghost" className="text-blue-600 font-bold flex items-center gap-2">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-3xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {properties.map((prop, idx) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PropertyCard 
                        property={prop} 
                        onClick={() => handlePropertyClick(prop)}
                        onToggleComparison={() => toggleComparison(prop)}
                        isComparing={comparisonList.some(p => p.id === prop.id)}
                        isLoggedIn={!!user}
                        initialSaved={savedPropertyIds.includes(prop.id)}
                        onToggleSave={handleToggleSaveGlobal}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Comparison Floating Button */}
              {comparisonList.length > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="fixed bottom-24 right-8 z-40"
                >
                  <Button 
                    onClick={() => setShowComparison(true)}
                    className="h-14 px-6 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl flex items-center gap-3 group"
                  >
                    <div className="relative">
                      <Layers className="w-6 h-6 text-white" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-blue-600">
                        {comparisonList.length}
                      </span>
                    </div>
                    <span className="font-bold text-white">So sánh ngay</span>
                  </Button>
                </motion.div>
              )}

              {/* Comparison Modal */}
              <AnimatePresence>
                {showComparison && (
                  <PropertyComparison 
                    properties={comparisonList}
                    user={user}
                    onRemove={(id) => setComparisonList(comparisonList.filter(p => p.id !== id))}
                    onClose={() => setShowComparison(false)}
                  />
                )}
              </AnimatePresence>
            </section>

            {/* AI Features Highlight */}
            <section className="bg-gray-900 py-20 rounded-[3rem] mx-4 sm:mx-0">
              <div className="max-w-[1440px] mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                      Công nghệ AI <br /> <span className="text-blue-500">thay đổi cách</span> bạn mua bán nhà
                    </h2>
                    <div className="space-y-6">
                      <FeatureItem 
                        icon={<TrendingUp className="text-blue-500" />}
                        title="Định giá thông minh"
                        desc="Sử dụng Machine Learning để phân tích hàng triệu dữ liệu, đưa ra giá trị thực tế nhất cho bất động sản."
                      />
                      <FeatureItem 
                        icon={<Sparkles className="text-purple-500" />}
                        title="Tự động tạo nội dung"
                        desc="AI giúp bạn viết mô tả tin đăng hấp dẫn, chuyên nghiệp chỉ trong vài giây."
                      />
                      <FeatureItem 
                        icon={<MapPin className="text-green-500" />}
                        title="Phân tích vị trí"
                        desc="Tự động đánh giá tiện ích lân cận, tiềm năng tăng giá và hạ tầng khu vực."
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full" />
                    <img 
                      src="https://picsum.photos/seed/ai-realestate/800/600" 
                      className="relative rounded-3xl shadow-2xl border border-white/10"
                      alt="AI Feature"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      case 'market':
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Phân tích thị trường</h1>
              <p className="text-gray-500">Dữ liệu thời gian thực giúp bạn đưa ra quyết định đầu tư đúng đắn</p>
            </div>
            <MarketDashboard userRole={user?.role} />
          </div>
        );
      case 'post':
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng tin rao bán</h1>
              <p className="text-gray-500">Quy trình đăng tin chuyên nghiệp với sự hỗ trợ của AI</p>
            </div>
            <PropertyStepper onNavigate={setCurrentPage} user={user} onRefresh={fetchProperties} />
          </div>
        );
      case 'pricing':
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <Pricing user={user} onShowAuth={() => setShowAuthModal(true)} />
          </div>
        );
      case 'profile':
        if (user?.role === 'agent') {
            return (
              <div className="max-w-[1440px] mx-auto px-4 py-12">
                <AgentDashboard onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
              </div>
            );
        }
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <UserDashboard onNavigate={setCurrentPage} onAdminNavigate={handleAdminNavigate} user={user} onLogout={handleLogout} />
          </div>
        );
      case 'agent-account':
        if (user?.role === 'agent') {
          return (
            <div className="max-w-[1440px] mx-auto px-4 py-12">
              <AgentDashboard initialTab="settings" onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
            </div>
          );
        }
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <UserDashboard onNavigate={setCurrentPage} onAdminNavigate={handleAdminNavigate} user={user} onLogout={handleLogout} />
          </div>
        );
      case 'notifications':
        if (user?.role === 'agent') {
          return (
            <div className="max-w-[1440px] mx-auto px-4 py-12">
              <AgentDashboard initialTab="notifications" onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
            </div>
          );
        }
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <UserDashboard initialTab="notifications" onNavigate={setCurrentPage} onAdminNavigate={handleAdminNavigate} user={user} onLogout={handleLogout} />
          </div>
        );
      case 'admin':
        // Guard: chỉ admin mới được vào trang này
        if (user?.role !== 'admin') {
          // Agent về AgentDashboard, user về UserDashboard
          return (
            <div className="max-w-[1440px] mx-auto px-4 py-12">
              {user?.role === 'agent'
                ? <AgentDashboard onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
                : <UserDashboard onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
              }
            </div>
          );
        }
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <AdminDashboard onNavigate={setCurrentPage} initialTab={adminInitialTab} />
          </div>
        );
      case 'admin-users':
        // Guard: chỉ admin mới được vào trang này
        if (user?.role !== 'admin') {
          setCurrentPage('admin');
          return null;
        }
        return <AdminUserManagement />;
      case 'kyc':
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-12">
            <KYCVerification onComplete={() => setCurrentPage('profile')} />
          </div>
        );
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} />;
      case 'contact':
        return <ContactPage onNavigate={setCurrentPage} />;
      case 'search':
        return (
          <SearchResultsPage 
            initialSearch={searchTerm}
            initialFilters={searchFilters}
            onNavigate={setCurrentPage}
            onPropertyClick={handlePropertyClick}
            user={user}
            savedPropertyIds={savedPropertyIds}
            onToggleSave={handleToggleSaveGlobal}
          />
        );
      case 'detail':
        return selectedProperty ? (
          <PropertyDetail 
            property={selectedProperty} 
            onBack={() => setCurrentPage('home')} 
            onPropertyClick={handlePropertyClick}
            similarProperties={properties.filter(p => p.id !== selectedProperty.id)}
            user={user}
            onToggleSave={handleToggleSaveGlobal}
            initialSaved={savedPropertyIds.includes(selectedProperty.id)}
          />
        ) : null;
      case 'messages':
        return (
          <div className="max-w-[1440px] mx-auto px-4 py-6">
            <MessengerPage user={user} defaultReceiverId={chatDefaultReceiver} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
        userRole={user?.role}
        user={user}
        onShowAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        chatUnread={chatUnread}
        onOpenChat={(receiverId?: number) => {
          setChatDefaultReceiver(receiverId);
          setCurrentPage('messages');
        }}
      />
      
      <main className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {currentPage !== 'messages' && <AIChatbot />}

      <PropertyNotification 
        notifications={notifications} 
        onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />

      {/* Auth Modal */}
      {renderAuthModal()}

      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-[1440px] mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-blue-600 p-1 rounded-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SmartRE</span>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            Hệ thống quản lý bất động sản thông minh hàng đầu Việt Nam. 
            Ứng dụng công nghệ AI để mang lại trải nghiệm mua bán tốt nhất.
          </p>
          <div className="flex justify-center gap-6 text-sm font-medium text-gray-400">
            <button onClick={() => setCurrentPage('about')} className="hover:text-blue-600 transition-colors">Về chúng tôi</button>
            <button onClick={() => setCurrentPage('about')} className="hover:text-blue-600 transition-colors">Điều khoản</button>
            <button onClick={() => setCurrentPage('about')} className="hover:text-blue-600 transition-colors">Bảo mật</button>
            <button onClick={() => setCurrentPage('contact')} className="hover:text-blue-600 transition-colors">Liên hệ</button>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400">
            © 2026 SmartRE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
