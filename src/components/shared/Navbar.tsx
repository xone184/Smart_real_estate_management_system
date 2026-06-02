import React, { useState, useRef, useEffect } from 'react';
import { Home, Search, PlusCircle, BarChart2, User, Bell, Menu, Shield, LogIn, LogOut, Settings, ChevronDown, X, Tag, Info, Phone, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { ApiNotification, apiGetNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead, apiGetRealEstateNews, ApiNewsItem } from '../../services/api';
import { ExternalLink, Rss } from 'lucide-react';
import { Avatar } from './Avatar';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  userRole?: string;
  user?: { id: number; display_name: string; photo_url?: string; role?: string } | null;
  onShowAuth?: () => void;
  onLogout?: () => void;
  chatUnread?: number;
  onOpenChat?: (receiverId?: number) => void;
}

export function Navbar({ onNavigate, currentPage, userRole, user, onShowAuth, onLogout, chatUnread = 0, onOpenChat }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuAvatarError, setMenuAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

  const [activeNotiTab, setActiveNotiTab] = useState<'system' | 'news'>('system');
  const [newsList, setNewsList] = useState<ApiNewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (showNotifications && activeNotiTab === 'news' && newsList.length === 0 && !loadingNews) {
      setLoadingNews(true);
      apiGetRealEstateNews()
        .then(res => setNewsList(res))
        .catch(() => {})
        .finally(() => setLoadingNews(false));
    }
  }, [showNotifications, activeNotiTab, newsList.length, loadingNews]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications khi user đăng nhập
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await apiGetNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      // User chưa đăng nhập hoặc lỗi - bỏ qua
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {}
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {}
  };

  const navItems = [
    { id: 'home', label: 'Khám phá', icon: <Search className="w-4 h-4" /> },
    { id: 'market', label: 'Thị trường', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'pricing', label: 'Bảng giá', icon: <Tag className="w-4 h-4" /> },
    { id: 'post', label: 'Đăng tin', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'about', label: 'Về chúng tôi', icon: <Info className="w-4 h-4" /> },
  ];

  if (userRole === 'admin') {
    navItems.push({ id: 'admin', label: 'Quản trị', icon: <Shield className="w-4 h-4" /> });
  }

  const navigateAndClose = (page: string) => {
    onNavigate(page);
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  const notiTypeColors: Record<string, string> = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">SmartRE</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notiRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 relative"
                  onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications(); }}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-gray-100">
                        <div className="flex gap-4">
                          <button 
                            className={cn("pb-3 font-bold text-sm transition-colors border-b-2 relative", activeNotiTab === 'system' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900")} 
                            onClick={() => setActiveNotiTab('system')}
                          >
                            Hệ thống
                            {unreadCount > 0 && (
                              <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">{unreadCount}</span>
                            )}
                          </button>
                          <button 
                            className={cn("pb-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-1.5", activeNotiTab === 'news' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900")} 
                            onClick={() => setActiveNotiTab('news')}
                          >
                            Tin tức
                            <Rss className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {activeNotiTab === 'system' && unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="pb-3 text-xs text-blue-600 hover:underline font-medium"
                          >
                            Đã đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
                        {activeNotiTab === 'system' ? (
                          notifications.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">Không có thông báo</div>
                          ) : (
                            notifications.map(noti => (
                              <div
                                key={noti.id}
                                onClick={() => {
                                  if (!noti.is_read) handleMarkRead(noti.id);
                                  onNavigate?.('notifications');
                                  setShowNotifications(false);
                                }}
                                className={cn(
                                  "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                                  !noti.is_read && "bg-blue-50/60"
                                )}
                              >
                                <div className="flex gap-3">
                                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", notiTypeColors[noti.type] || 'bg-blue-500')} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{noti.title}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{noti.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      {new Date(noti.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          loadingNews ? (
                            <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                          ) : newsList.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">Không có tin tức mới</div>
                          ) : (
                            newsList.map(news => (
                              <a
                                key={news.id}
                                href={news.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                                    {news.source === 'reddit' ? (
                                      <span className="text-orange-500 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Reddit</span>
                                    ) : (
                                      <span className="text-blue-500 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Báo chí</span>
                                    )}
                                    <span className="text-gray-300">•</span>
                                    <span>{news.author}</span>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">{news.title}</p>
                                  {news.snippet && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{news.snippet}</p>}
                                  <p className="text-[10px] text-gray-400 mt-1.5">
                                    {new Date(news.timestamp).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                              </a>
                            ))
                          )
                        )}
                      </div>
                      {activeNotiTab === 'system' && (
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={() => { navigateAndClose('notifications'); setShowNotifications(false); }}
                            className="w-full text-xs text-center text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                          >
                            Xem tất cả thông báo hệ thống →
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!user && (
              <Button variant="ghost" size="icon" className="text-gray-500 relative">
                <Bell className="w-5 h-5" />
              </Button>
            )}

            {/* Chat icon */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('text-gray-500 relative', currentPage === 'messages' && 'text-blue-600 bg-blue-50')}
                  onClick={() => onOpenChat?.()}
                  title="Tin nhắn"
                >
                  <MessageCircle className="w-5 h-5" />
                  {chatUnread > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {!user && (
              <Button variant="ghost" size="icon" className="text-gray-500 relative">
                <MessageCircle className="w-5 h-5" />
              </Button>
            )}

            <div className="h-8 w-px bg-gray-200 mx-1" />

            {/* Auth-aware user section */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <Avatar
                    src={user.photo_url}
                    name={user.display_name}
                    size={7}
                    className="border border-gray-200"
                  />
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.display_name}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showUserMenu && "rotate-180")} />
                </button>

                      {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-900">{user.display_name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {userRole === 'admin' ? '🛡️ Quản trị viên'
                            : userRole === 'agent' ? '🏢 Môi giới'
                            : '👤 Người dùng'}
                        </p>
                      </div>
                      <div className="py-1">
                        {/* Admin-only link */}
                        {userRole === 'admin' && (
                          <button
                            onClick={() => { navigateAndClose('admin'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-red-500" />
                            Bảng quản trị
                          </button>
                        )}

                        {/* Agent-only link */}
                        {userRole === 'agent' && (
                          <button
                            onClick={() => { navigateAndClose('profile'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-blue-500" />
                            Dashboard Môi giới
                          </button>
                        )}

                        {/* Common: My account */}
                        <button
                          onClick={() => { navigateAndClose(userRole === 'agent' ? 'agent-account' : 'profile'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Tài khoản của tôi
                        </button>

                        <button
                          onClick={() => { navigateAndClose('post'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-gray-400" />
                          Đăng tin mới
                        </button>

                        <button
                          onClick={() => { setShowUserMenu(false); onOpenChat?.(); }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                            currentPage === 'messages' && 'text-blue-600 bg-blue-50'
                          )}
                        >
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          Tin nhắn
                          {chatUnread > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {chatUnread}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => { navigateAndClose('kyc'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          Cài đặt & KYC
                        </button>
                      </div>
                      <div className="border-t border-gray-50 py-1">
                        <button
                          onClick={() => { onLogout?.(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="hidden sm:flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onShowAuth}
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Button>
            )}

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateAndClose(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              <div className="border-t border-gray-100 pt-2 mt-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 mb-1">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {user.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.display_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateAndClose('profile')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 text-gray-400" /> Tài khoản
                    </button>
                    <button
                      onClick={() => { onLogout?.(); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </>
                ) : (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                    onClick={() => { onShowAuth?.(); setShowMobileMenu(false); }}
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Đăng nhập
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
