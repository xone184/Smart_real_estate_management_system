import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, MessageCircle, Phone, Video, Info,
  Shield, Zap, Sparkles, User, ChevronLeft, Loader2, Circle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  apiGetContacts, apiGetConversations, apiGetMessages, apiSendMessage,
  ApiContact, ApiConversation, ApiMessage,
} from '../../services/api';
import { UserProfile } from '../../types';

// ── helpers ───────────────────────────────────────────────────────────────────

function roleIcon(role: string) {
  if (role === 'admin')  return <Shield className="w-3 h-3 text-red-500" />;
  if (role === 'agent')  return <Zap className="w-3 h-3 text-blue-500" />;
  return <User className="w-3 h-3 text-gray-400" />;
}

function roleBadge(role: string) {
  if (role === 'admin')  return 'Quản trị viên';
  if (role === 'agent')  return 'Môi giới';
  return 'Người dùng';
}

function resolvePhoto(photo?: string): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  // Use current origin so it works on any host/port (XAMPP, dev server, etc.)
  const base = window.location.origin;
  return `${base}${photo.startsWith('/') ? '' : '/'}${photo}`;
}

function Avatar({
  name, photo, size = 10,
}: { name?: string; photo?: string; size?: number }) {
  const src = resolvePhoto(photo);
  const [imgError, setImgError] = React.useState(false);

  // Reset error state when photo changes
  React.useEffect(() => { setImgError(false); }, [photo]);

  const showImg = src && !imgError;
  return (
    <div
      className={cn(
        'rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden flex-shrink-0'
      )}
      style={{ width: size * 4, height: size * 4, minWidth: size * 4 }}
    >
      {showImg
        ? <img src={src} className="w-full h-full object-cover" alt="" onError={() => setImgError(true)} />
        : <span style={{ fontSize: size * 1.6 }}>{name?.charAt(0) || '?'}</span>}
    </div>
  );
}

function formatTime(ts: string) {
  // Ensure MySQL 'YYYY-MM-DD HH:MM:SS' is parsed correctly across all browsers
  // Append +07:00 to explicitly tell JS this is Vietnam time
  let safeTs = ts.replace(' ', 'T');
  if (!safeTs.includes('+') && !safeTs.includes('Z')) {
    safeTs += '+07:00';
  }
  const d = new Date(safeTs);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── Main component ────────────────────────────────────────────────────────────

interface MessengerPageProps {
  user: UserProfile | null;
  defaultReceiverId?: number; // Mở thẳng chat với ai khi từ appointment
}

export function MessengerPage({ user, defaultReceiverId }: MessengerPageProps) {
  const [contacts, setContacts]           = useState<ApiContact[]>([]);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [messages, setMessages]           = useState<ApiMessage[]>([]);
  const [activeConvId, setActiveConvId]   = useState<number | null>(null);
  const [activePartner, setActivePartner] = useState<ApiContact | null>(null);
  const [inputText, setInputText]         = useState('');
  const [sending, setSending]             = useState(false);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [searchQ, setSearchQ]             = useState('');
  const [mobileView, setMobileView]       = useState<'list' | 'chat'>('list');

  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // ── load contacts + conversations once ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadContacts();
    loadConversations();
  }, [user]);

  // ── auto-open conversation with defaultReceiverId ───────────────────────────
  useEffect(() => {
    if (defaultReceiverId && contacts.length > 0) {
      const partner = contacts.find(c => c.id === defaultReceiverId);
      if (partner) openChat(partner);
    }
  }, [defaultReceiverId, contacts]);

  // ── polling every 4 s ──────────────────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadConversations();
      if (activeConvId) loadMessages(activeConvId, false);
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConvId]);

  // Auto-scroll removed as per user request


  // ── API calls ─────────────────────────────────────────────────────────────
  const loadContacts = async () => {
    try { setContacts(await apiGetContacts()); } catch {}
  };

  const loadConversations = async () => {
    try { setConversations(await apiGetConversations()); } catch {}
  };

  const loadMessages = async (convId: number, showSpinner = true) => {
    if (showSpinner) setLoadingMsgs(true);
    try { setMessages(await apiGetMessages(convId)); } catch {}
    finally { if (showSpinner) setLoadingMsgs(false); }
  };

  // ── open chat pane ─────────────────────────────────────────────────────────
  const openChat = useCallback(async (partner: ApiContact) => {
    setActivePartner(partner);
    setMobileView('chat');
    setMessages([]);

    // Check if conversation already exists
    const existing = conversations.find(c => c.partner_id === partner.id);
    if (existing) {
      setActiveConvId(existing.id);
      await loadMessages(existing.id);
    } else {
      // No conversation yet — will be created on first send
      setActiveConvId(null);
    }
    inputRef.current?.focus();
  }, [conversations]);

  // ── send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() || !activePartner || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic UI
    const tempMsg: ApiMessage = {
      id: Date.now(),
      sender_id: user!.id,
      sender_name: user!.display_name,
      sender_photo: user!.photo_url ?? '',
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await apiSendMessage({ receiver_id: activePartner.id, content: text });
      setActiveConvId(res.conversation_id);
      // Reload real messages
      await loadMessages(res.conversation_id, false);
      await loadConversations();
    } catch {
      // Remove optimistic msg on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── contact list = contacts + conversations merged (dedupe by partner) ──────
  const contactList = (() => {
    const convByPartner = new Map(conversations.map(c => [c.partner_id, c]));

    // All contacts as base
    const listed = contacts.map(c => ({
      contact: c,
      conv: convByPartner.get(c.id) ?? null,
    }));

    // Sort: admin first, then by last message time desc, then alpha
    listed.sort((a, b) => {
      if (a.contact.role === 'admin' && b.contact.role !== 'admin') return -1;
      if (b.contact.role === 'admin' && a.contact.role !== 'admin') return 1;
      const ta = a.conv?.last_message_at ?? '';
      const tb = b.conv?.last_message_at ?? '';
      if (ta && tb) return tb.localeCompare(ta);
      if (ta) return -1;
      if (tb) return 1;
      return a.contact.display_name.localeCompare(b.contact.display_name);
    });

    return listed;
  })();

  const filtered = searchQ
    ? contactList.filter(({ contact }) =>
        contact.display_name.toLowerCase().includes(searchQ.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQ.toLowerCase()))
    : contactList;

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  // ── render ─────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-400">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Vui lòng đăng nhập để sử dụng Chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <div className={cn(
        'flex flex-col border-r border-gray-100 bg-white',
        'w-full md:w-80 lg:w-96 flex-shrink-0',
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Chat
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Avatar name={user.display_name} photo={user.photo_url} size={8} />
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-200 border-none"
            />
          </div>
        </div>

        {/* Contact/Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm px-4">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Không tìm thấy liên hệ</p>
            </div>
          ) : (
            filtered.map(({ contact, conv }) => {
              const isActive = activePartner?.id === contact.id;
              const unread = conv?.unread_count ?? 0;
              return (
                <button
                  key={contact.id}
                  onClick={() => openChat(contact)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-gray-50',
                    isActive && 'bg-blue-50 hover:bg-blue-50'
                  )}
                >
                  <div className="relative">
                    <Avatar name={contact.display_name} photo={contact.photo_url} size={11} />
                    {/* Online indicator (static) */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-semibold truncate', isActive ? 'text-blue-700' : 'text-gray-900')}>
                        {contact.display_name}
                      </span>
                      {conv?.last_message_at && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {roleIcon(contact.role)}
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {conv?.last_message ?? roleBadge(contact.role)}
                      </span>
                      {unread > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 px-1">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right chat pane ───────────────────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex flex-col bg-gray-50',
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      )}>
        {!activePartner ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Chọn một cuộc trò chuyện</h3>
              <p className="text-sm max-w-xs mx-auto">
                Chọn liên hệ ở bên trái để bắt đầu nhắn tin. Admin luôn sẵn sàng hỗ trợ bạn.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  className="md:hidden p-1 text-gray-500 hover:text-gray-800"
                  onClick={() => setMobileView('list')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <Avatar name={activePartner.display_name} photo={activePartner.photo_url} size={10} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{activePartner.display_name}</p>
                  <div className="flex items-center gap-1">
                    {roleIcon(activePartner.role)}
                    <span className="text-xs text-gray-500">{roleBadge(activePartner.role)}</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                    <span className="text-xs text-green-600">Đang hoạt động</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Gọi thoại">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Gọi video">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Thông tin">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Avatar name={activePartner.display_name} photo={activePartner.photo_url} size={16} />
                  <p className="font-semibold text-gray-700">{activePartner.display_name}</p>
                  <p className="text-xs text-gray-400">{roleBadge(activePartner.role)}</p>
                  <p className="text-sm text-gray-500 mt-2">Hãy bắt đầu cuộc trò chuyện! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user.id;
                    const prevMsg = messages[idx - 1];
                    const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const showTime = !messages[idx + 1] ||
                      messages[idx + 1].sender_id !== msg.sender_id ||
                      (new Date(messages[idx + 1].created_at).getTime() - new Date(msg.created_at).getTime()) > 60000;

                    // Avatar size = 8 → 8*4 = 32px
                    const avatarSize = 8;
                    const avatarPx = avatarSize * 4; // 32

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex w-full gap-2 items-end',
                          isMine ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {/* Avatar hoặc spacer bên trái (tin của đối phương) */}
                        {!isMine && (
                          showAvatar
                            ? <Avatar name={msg.sender_name} photo={msg.sender_photo} size={avatarSize} />
                            : <div style={{ width: avatarPx, minWidth: avatarPx }} />
                        )}

                        <div className={cn('flex flex-col max-w-[70%]', isMine ? 'items-end' : 'items-start')}>
                          <div
                            className={cn(
                              'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                            )}
                          >
                            {msg.content}
                          </div>
                          {showTime && (
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {formatTime(msg.created_at)}
                              {isMine && (
                                <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Avatar hoặc spacer bên phải (tin của mình) */}
                        {isMine && (
                          showAvatar
                            ? <Avatar name={msg.sender_name} photo={msg.sender_photo} size={avatarSize} />
                            : <div style={{ width: avatarPx, minWidth: avatarPx }} />
                        )}
                      </div>
                    );
                  })}
                  {/* Auto-scroll div removed */}
                </>
              )}
            </div>

            {/* Input area */}
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nhắn tin cho ${activePartner.display_name}...`}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                    inputText.trim() && !sending
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Nhấn <kbd className="bg-gray-100 px-1 rounded text-[9px]">Enter</kbd> để gửi
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
