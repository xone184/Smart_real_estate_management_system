import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Building2, CheckCircle2, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Card, CardContent } from '../shared/ui/Card';
import { apiSendContact } from '../../services/api';


interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

const offices = [
  {
    city: 'TP. Hồ Chí Minh',
    address: '72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1',
    phone: '(028) 3823 4567',
    email: 'hcm@smartre.vn',
    hours: 'T2–T7: 8:00–18:00',
    isPrimary: true,
  },
  {
    city: 'Hà Nội',
    address: '54 Lý Thường Kiệt, Quận Hoàn Kiếm',
    phone: '(024) 3923 5678',
    email: 'hn@smartre.vn',
    hours: 'T2–T7: 8:00–18:00',
    isPrimary: false,
  },
  {
    city: 'Đà Nẵng',
    address: '112 Trần Phú, Quận Hải Châu',
    phone: '(0236) 382 9012',
    email: 'dn@smartre.vn',
    hours: 'T2–T6: 8:00–17:00',
    isPrimary: false,
  },
];

const topics = [
  'Hỗ trợ kỹ thuật',
  'Tư vấn mua bán BĐS',
  'Đăng ký gói dịch vụ',
  'Hợp tác kinh doanh',
  'Báo cáo vi phạm',
  'Khác',
];

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Required fields check
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, Email, Nội dung)');
      return;
    }

    // Name validation
    if (form.name.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Định dạng Email không hợp lệ');
      return;
    }

    // Phone validation (optional field, but if provided should be valid)
    if (form.phone.trim()) {
      const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
      if (!phoneRegex.test(form.phone.trim().replace(/\s/g, ''))) {
        setError('Số điện thoại không hợp lệ (Vui lòng dùng định dạng Việt Nam, ví dụ: 0901234567)');
        return;
      }
    }

    // Message length check
    if (form.message.trim().length < 10) {
      setError('Nội dung tin nhắn quá ngắn (vui lòng nhập ít nhất 10 ký tự)');
      return;
    }

    setSubmitting(true);
    
    try {
      await apiSendContact(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-blue-700/40 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
              <MessageSquare className="w-4 h-4 text-blue-300" />
              <span className="text-blue-200">Liên hệ với chúng tôi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Chúng tôi luôn sẵn sàng hỗ trợ</h1>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Đội ngũ tư vấn chuyên nghiệp của SmartRE sẵn sàng giải đáp mọi thắc mắc 
              về BĐS, pháp lý và sử dụng nền tảng.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="max-w-[1440px] mx-auto px-4 -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Phone className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50', title: 'Hotline 24/7', value: '1800 6789', sub: 'Miễn phí cuộc gọi' },
            { icon: <Mail className="w-6 h-6 text-green-600" />, bg: 'bg-green-50', title: 'Email hỗ trợ', value: 'support@smartre.vn', sub: 'Phản hồi trong 2 giờ' },
            { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50', title: 'Chat trực tiếp', value: 'AI Chatbot', sub: 'Hỗ trợ ngay lập tức' },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    {item.icon}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form + Offices */}
      <section className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-green-50 rounded-3xl border border-green-100"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi thành công!</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 2 giờ làm việc.
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-11"
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', topic: '', message: '' }); }}
                >
                  Gửi tin nhắn khác
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="0901 234 567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chủ đề</label>
                  <select
                    value={form.topic}
                    onChange={e => setForm({ ...form, topic: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung *</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                    placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base"
                >
                  {submitting ? (
                    'Đang gửi...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Gửi tin nhắn
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Offices */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Văn phòng của chúng tôi</h2>
            {offices.map((office, idx) => (
              <motion.div
                key={office.city}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 rounded-2xl border transition-all ${
                  office.isPrimary
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-gray-100 bg-white hover:border-blue-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${office.isPrimary ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{office.city}</h3>
                      {office.isPrimary && (
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Trụ sở chính</span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />{office.address}</p>
                      <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{office.phone}</p>
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{office.email}</p>
                      <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" />{office.hours}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Social Links */}
            <div className="p-5 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Kết nối với SmartRE</h3>
              <div className="flex gap-3">
                {[
                  { icon: <Facebook className="w-5 h-5" />, label: 'Facebook', color: 'bg-blue-600' },
                  { icon: <Youtube className="w-5 h-5" />, label: 'Youtube', color: 'bg-red-600' },
                  { icon: <Linkedin className="w-5 h-5" />, label: 'LinkedIn', color: 'bg-blue-700' },
                ].map(s => (
                  <button
                    key={s.label}
                    className={`${s.color} text-white w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity`}
                    title={s.label}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
