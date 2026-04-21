// =============================================
// SmartRE - API Service Layer
// Thay thế Firebase SDK bằng PHP REST API calls
// =============================================

const API_BASE = '/smart-real-estate-management-system/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include', // Gửi session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra');
  }

  return data;
}

async function download(url: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    let msg = 'Không thể tải báo cáo';
    try {
      const data = await response.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return response.blob();
}

// =============================================
// Auth API
// =============================================
export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  photo_url: string;
  role: 'admin' | 'user' | 'agent';
  kyc_verified: boolean;
  created_at: string;
}

export async function apiLogin(email: string, password: string): Promise<{ message: string; user: AuthUser }> {
  return request('/auth/auth.php?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(email: string, password: string, displayName: string, role: string = 'user'): Promise<{ message: string; user: AuthUser }> {
  return request('/auth/auth.php?action=register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName, role }),
  });
}

/** Gửi mã OTP xác thực về email để đăng ký */
export async function apiSendOTP(email: string, password: string, displayName: string, role: string): Promise<{
  message: string;
  masked_email: string;
  expires_in: number;
}> {
  return request('/auth/send_otp.php?action=send', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName, role }),
  });
}

/** Xác thực mã OTP và tạo tài khoản */
export async function apiVerifyOTP(email: string, otp: string, password: string, displayName: string, role: string): Promise<{
  message: string;
  user: AuthUser;
}> {
  return request('/auth/send_otp.php?action=verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password, display_name: displayName, role }),
  });
}

export async function apiLogout(): Promise<{ message: string }> {
  return request('/auth/auth.php?action=logout', {
    method: 'POST',
  });
}

export async function apiGetMe(): Promise<{ user: AuthUser | null }> {
  return request('/auth/auth.php?action=me');
}

// =============================================
// Properties API
// =============================================
export interface ApiProperty {
  id: number;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'land' | 'villa';
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  legal: string;
  address: string;
  location: { lat: number; lng: number };
  images: string[];
  video_url: string;
  tour_3d_url: string;
  legal_scan_url?: string;
  planning_url?: string;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  status: 'pending' | 'active' | 'sold' | 'rejected';
  reject_reason?: string | null;
  ai_valuation: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function apiGetProperties(filters?: {
  owner_id?: number;
  status?: string;
  type?: string;
  city?: string;
  search?: string;
  created_from?: string;
  created_to?: string;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: number;
  direction?: string;
}): Promise<ApiProperty[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  const query = params.toString() ? `&${params.toString()}` : '';
  // Use a dummy param to separate from potential id param
  return request(`/properties/properties.php?list=1${query}`);
}

export async function apiGetProperty(id: number): Promise<ApiProperty> {
  return request(`/properties/properties.php?id=${id}`);
}

export async function apiCreateProperty(data: Partial<ApiProperty>): Promise<{ message: string; id: number }> {
  return request('/properties/properties.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateProperty(id: number, data: Partial<ApiProperty>): Promise<{ message: string }> {
  return request(`/properties/properties.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiBulkUpdatePropertyStatus(data: {
  ids: number[];
  status: 'pending' | 'active' | 'sold' | 'rejected';
  reject_reason?: string;
}): Promise<{ message: string; updated: number }> {
  return request(`/properties/properties.php?action=bulk_update_status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteProperty(id: number): Promise<{ message: string }> {
  return request(`/properties/properties.php?id=${id}`, {
    method: 'DELETE',
  });
}

// =============================================
// Reviews API
// =============================================
export interface ApiReview {
  id: number;
  property_id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  likes: number;
  verified: boolean;
  created_at: string;
}

export async function apiGetReviews(propertyId: number): Promise<ApiReview[]> {
  return request(`/properties/reviews.php?property_id=${propertyId}`);
}

export async function apiCreateReview(data: {
  property_id: number;
  rating: number;
  comment: string;
}): Promise<{ message: string; id: number }> {
  return request('/properties/reviews.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteReview(id: number): Promise<{ message: string }> {
  return request(`/properties/reviews.php?id=${id}`, {
    method: 'DELETE',
  });
}

// =============================================
// Users API
// =============================================
export async function apiGetUsers(): Promise<AuthUser[]> {
  return request('/users/users.php');
}

export async function apiGetUser(id: number): Promise<AuthUser> {
  return request(`/users/users.php?id=${id}`);
}

export async function apiUpdateUser(id: number, data: Partial<AuthUser & { password?: string }>): Promise<{ message: string }> {
  return request(`/users/users.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// =============================================
// Seed API
// =============================================
export async function apiSeedData(): Promise<{ message: string }> {
  return request('/tools/seed.php', {
    method: 'POST',
  });
}

// =============================================
// Saved Properties API
// =============================================
export async function apiGetSavedProperties(): Promise<ApiProperty[]> {
  return request('/properties/saved_properties.php');
}

export async function apiSaveProperty(propertyId: number): Promise<{ message: string; saved: boolean }> {
  return request('/properties/saved_properties.php', {
    method: 'POST',
    body: JSON.stringify({ property_id: propertyId }),
  });
}

export async function apiUnsaveProperty(propertyId: number): Promise<{ message: string; saved: boolean }> {
  return request(`/properties/saved_properties.php?property_id=${propertyId}`, {
    method: 'DELETE',
  });
}

// =============================================
// Notifications API
// =============================================
export interface ApiNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string;
  created_at: string;
}

export async function apiGetNotifications(): Promise<{ notifications: ApiNotification[]; unread_count: number }> {
  return request('/notifications/notifications.php');
}

export async function apiMarkNotificationRead(id: number): Promise<{ message: string }> {
  return request(`/notifications/notifications.php?id=${id}`, { method: 'PUT' });
}

export async function apiMarkAllNotificationsRead(): Promise<{ message: string }> {
  return request('/notifications/notifications.php?action=read_all', { method: 'PUT' });
}

// =============================================
// News RSS API
// =============================================
export interface ApiNewsItem {
  id: string;
  title: string;
  link: string;
  snippet: string;
  source: 'google_news' | 'reddit';
  author: string;
  timestamp: number;
}

export async function apiGetRealEstateNews(): Promise<ApiNewsItem[]> {
  const res: any = await request('/news/news.php');
  return res.data || [];
}

// =============================================
// KYC API
// =============================================
export async function apiGetKYCStatus(): Promise<{ kyc_verified: boolean; document: any }> {
  return request('/users/kyc.php');
}

export async function apiSubmitKYC(formData: FormData): Promise<{ message: string }> {
  const response = await fetch('/smart-real-estate-management-system/api/users/kyc.php', {
    method: 'POST',
    body: formData,
    // Không set Content-Type 'application/json' vì browser tự sinh header multipart boundary
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Lỗi gửi KYC');
  return data;
}

// =============================================
// Appointments API
// =============================================
export interface ApiAppointment {
  id: number;
  property_id: number;
  user_id: number;
  owner_id: number;
  visit_date: string;
  time_slot: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  property_title?: string;
  visitor_name?: string;
  owner_name?: string;
  is_overdue?: boolean;
}

export async function apiGetAppointments(): Promise<ApiAppointment[]> {
  return request('/appointments/appointments.php');
}

export async function apiCreateAppointment(data: { property_id: number; visit_date: string; time_slot: string; message: string }): Promise<{ message: string; id: number }> {
  return request('/appointments/appointments.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateAppointmentStatus(id: number, status: string): Promise<{ message: string }> {
  return request(`/appointments/appointments.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function apiBulkUpdateAppointmentStatus(ids: number[], status: string): Promise<{ message: string; updated: number; ids: number[] }> {
  return request(`/appointments/appointments.php?action=bulk_update`, {
    method: 'PUT',
    body: JSON.stringify({ ids, status }),
  });
}

// =============================================
// Upload API
// =============================================
export async function apiUploadImages(files: File[], type: string = 'properties'): Promise<{ urls: string[], message: string }> {
  const formData = new FormData();
  formData.append('type', type);
  files.forEach(file => {
    formData.append('images[]', file);
  });

  const response = await fetch('/smart-real-estate-management-system/api/upload/upload.php', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload thất bại');
  return data;
}

// =============================================
// Market Stats API (tính từ DB properties)
// =============================================
export interface MarketStats {
  total_properties: number;
  total_active: number;
  avg_price: number;
  by_type: { type: string; count: number; avg_price: number }[];
  by_month: { month: string; count: number }[];
}

export async function apiGetMarketStats(): Promise<MarketStats> {
  return request('/properties/properties.php?action=market_stats');
}

// =============================================
// Admin Reports API (CSV export)
// =============================================
export type AdminReportEntity = 'properties' | 'users' | 'subscriptions';

export async function apiAdminExportReport(params: {
  entity: AdminReportEntity;
  from?: string;   // YYYY-MM-DD
  to?: string;     // YYYY-MM-DD
  status?: string; // properties/subscriptions status; users role
  type?: string;   // properties type; subscriptions plan_name
  search?: string;
}): Promise<Blob> {
  const qs = new URLSearchParams();
  qs.set('entity', params.entity);
  qs.set('format', 'csv');
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.status) qs.set('status', params.status);
  if (params.type) qs.set('type', params.type);
  if (params.search) qs.set('search', params.search);
  return download(`/reports/reports.php?${qs.toString()}`);
}

// =============================================
// Subscriptions API (Gói đăng ký dịch vụ)
// =============================================
export interface ApiSubscription {
  id: number;
  user_id: number;
  plan_name: 'basic' | 'professional' | 'enterprise';
  plan_label: string;
  price_vnd: string;
  payment_method: 'qr_transfer' | 'credit_card' | 'contact';
  status: 'pending' | 'active' | 'rejected' | 'cancelled';
  note: string;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
  user_role?: string;
  user_photo?: string;
}

/** Lấy danh sách gói đăng ký của user hiện tại */
export async function apiGetMySubscriptions(): Promise<ApiSubscription[]> {
  return request('/subscriptions/subscriptions.php');
}

/** Admin lấy toàn bộ yêu cầu đăng ký */
export async function apiAdminGetSubscriptions(): Promise<ApiSubscription[]> {
  return request('/subscriptions/subscriptions.php?action=admin_list');
}

/** Tạo yêu cầu đăng ký gói mới */
export async function apiCreateSubscription(data: {
  plan_name: 'basic' | 'professional' | 'enterprise';
  plan_label: string;
  price_vnd: string;
  payment_method: 'qr_transfer' | 'credit_card' | 'contact';
  note?: string;
}): Promise<{ message: string; id: number; status: string }> {
  return request('/subscriptions/subscriptions.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Admin duyệt / từ chối yêu cầu đăng ký */
export async function apiUpdateSubscriptionStatus(
  id: number,
  status: 'active' | 'rejected' | 'cancelled',
  note?: string
): Promise<{ message: string; status: string }> {
  return request(`/subscriptions/subscriptions.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, note: note ?? '' }),
  });
}

/** User huỷ yêu cầu đang pending */
export async function apiCancelSubscription(id: number): Promise<{ message: string }> {
  return request(`/subscriptions/subscriptions.php?id=${id}`, { method: 'DELETE' });
}

// =============================================
// Messages / Chat API
// =============================================
export interface ApiContact {
  id: number;
  display_name: string;
  photo_url: string;
  role: 'admin' | 'user' | 'agent';
  email: string;
}

export interface ApiConversation {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_photo: string;
  partner_role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface ApiMessage {
  id: number;
  conversation_id?: number;
  sender_id: number;
  sender_name: string;
  sender_photo: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** Danh sách liên hệ hợp lệ theo role */
export async function apiGetContacts(): Promise<ApiContact[]> {
  return request('/messages/messages.php?action=contacts');
}

/** Danh sách conversations của user */
export async function apiGetConversations(): Promise<ApiConversation[]> {
  return request('/messages/messages.php?action=conversations');
}

/** Tin nhắn trong 1 conversation */
export async function apiGetMessages(conversationId: number): Promise<ApiMessage[]> {
  return request(`/messages/messages.php?conversation_id=${conversationId}`);
}

/** Gửi tin nhắn (tự tạo conversation nếu chưa có) */
export async function apiSendMessage(data: {
  receiver_id: number;
  content: string;
}): Promise<{ message: string; message_id: number; conversation_id: number }> {
  return request('/messages/messages.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Số tin nhắn chưa đọc */
export async function apiGetChatUnreadCount(): Promise<{ unread_count: number }> {
  return request('/messages/messages.php?action=unread_count');
}
