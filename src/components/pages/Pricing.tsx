import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import {
  Check, Sparkles, Zap, Shield, X, CreditCard, QrCode, CheckCircle2,
  AlertCircle, Lock, Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { apiCreateSubscription } from '../../services/api';

const plans = [
  {
    id: 'basic' as const,
    name: 'Cơ bản',
    price: 'Miễn phí',
    period: undefined,
    description: 'Dành cho cá nhân đăng tin lẻ',
    features: [
      'Đăng tối đa 3 tin/tháng',
      'Hiển thị trong 7 ngày',
      'Hỗ trợ AI viết mô tả cơ bản',
      'Thống kê lượt xem cơ bản',
    ],
    icon: <Shield className="w-6 h-6 text-gray-400" />,
    buttonText: 'Bắt đầu ngay',
    variant: 'outline' as const,
    paymentMethod: 'contact' as const,
  },
  {
    id: 'professional' as const,
    name: 'Chuyên nghiệp',
    price: '499.000đ',
    period: '/tháng',
    description: 'Dành cho môi giới chuyên nghiệp',
    features: [
      'Đăng tin không giới hạn',
      'Đẩy tin top 1 lần/ngày',
      'AI định giá & phân tích thị trường',
      'Hỗ trợ tour 3D & Video HLS',
      'Xác minh KYC ưu tiên',
    ],
    icon: <Zap className="w-6 h-6 text-blue-600" />,
    buttonText: 'Nâng cấp ngay',
    variant: 'primary' as const,
    popular: true,
    paymentMethod: 'qr_transfer' as const,
  },
  {
    id: 'enterprise' as const,
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    period: undefined,
    description: 'Dành cho sàn giao dịch BĐS',
    features: [
      'Quản lý đội nhóm môi giới',
      'Dashboard phân tích chuyên sâu',
      'API tích hợp hệ thống riêng',
      'Hỗ trợ 24/7 riêng biệt',
      'Watermark thương hiệu riêng',
    ],
    icon: <Sparkles className="w-6 h-6 text-purple-600" />,
    buttonText: 'Liên hệ tư vấn',
    variant: 'outline' as const,
    paymentMethod: 'contact' as const,
  },
];

type Plan = typeof plans[0];

interface PricingProps {
  user?: { id: number; display_name?: string; email?: string } | null;
  onShowAuth?: () => void;
}

export function Pricing({ user, onShowAuth }: PricingProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr_transfer' | 'credit_card' | 'contact'>('qr_transfer');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleOpenPlan = (plan: Plan) => {
    if (!user) {
      onShowAuth?.();
      return;
    }
    setSelectedPlan(plan);
    setPaymentMethod(plan.paymentMethod);
    setSubmitState('idle');
    setResultMessage('');
    setFullName(user?.display_name ?? '');
    setPhone('');
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;
    setSubmitState('loading');
    try {
      const res = await apiCreateSubscription({
        plan_name: selectedPlan.id,
        plan_label: selectedPlan.name,
        price_vnd: selectedPlan.price,
        payment_method: selectedPlan.id === 'basic' ? 'contact' : paymentMethod,
        note: `Họ tên: ${fullName}. Số điện thoại: ${phone}`,
      });
      setResultMessage(res.message);
      setSubmitState('success');
      // Auto close after 4 s
      setTimeout(() => setSelectedPlan(null), 4000);
    } catch (err: any) {
      setResultMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      setSubmitState('error');
    }
  };

  return (
    <>
      <div className="py-12 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Gói dịch vụ linh hoạt</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Chọn gói dịch vụ phù hợp với nhu cầu của bạn để tối ưu hiệu quả kinh doanh bất động sản.
          </p>
          {!user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-medium">
              <Lock className="w-4 h-4" />
              Vui lòng <button onClick={onShowAuth} className="font-bold underline ml-1">đăng nhập</button> để đăng ký gói dịch vụ
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col transition-all hover:shadow-xl',
                plan.popular ? 'border-blue-200 shadow-blue-50 scale-105 z-10' : 'border-gray-100'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Phổ biến nhất
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="mt-0.5 bg-green-100 text-green-600 rounded-full p-0.5 min-w-[1.25rem]">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-8">
                <Button
                  variant={plan.variant}
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => handleOpenPlan(plan)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Registration / Payment Modal ── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white/80 rounded-full p-1"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Result screens */}
            {submitState === 'success' && (
              <div className="w-full p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi yêu cầu thành công!</h3>
                <p className="text-gray-600 max-w-sm">{resultMessage}</p>
                {selectedPlan.id !== 'basic' && (
                  <p className="text-gray-500 text-sm mt-3">
                    Quản trị viên sẽ xét duyệt và kích hoạt gói <span className="font-semibold text-blue-600">{selectedPlan.name}</span> trong thời gian sớm nhất.
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-4">Cửa sổ sẽ tự động đóng sau vài giây...</p>
              </div>
            )}

            {submitState === 'error' && (
              <div className="w-full p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                <p className="text-gray-600">{resultMessage}</p>
                <Button
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setSubmitState('idle')}
                >
                  Thử lại
                </Button>
              </div>
            )}

            {(submitState === 'idle' || submitState === 'loading') && (
              <>
                {/* Left - Plan Details */}
                <div className="w-full md:w-5/12 bg-gray-50 p-8 border-r border-gray-100">
                  <div className="mb-6 inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm">
                    {selectedPlan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gói {selectedPlan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold text-blue-600">{selectedPlan.price}</span>
                    {selectedPlan.period && (
                      <span className="text-gray-500 font-medium">{selectedPlan.period}</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Tính năng bao gồm:</h4>
                    <ul className="space-y-3 pb-4">
                      {selectedPlan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedPlan.id === 'professional' && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                      ✅ Tài khoản sẽ được nâng cấp lên <strong>Môi giới chuyên nghiệp</strong> sau khi Admin xác nhận thanh toán.
                    </div>
                  )}
                  {selectedPlan.id === 'enterprise' && (
                    <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700">
                      ✅ Tài khoản sẽ nhận toàn bộ quyền <strong>Doanh nghiệp</strong> sau khi được xét duyệt.
                    </div>
                  )}
                </div>

                {/* Right - Form */}
                <div className="w-full md:w-7/12 p-8 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {selectedPlan.id === 'enterprise' ? 'Thông tin đăng ký' : 'Xác nhận & Thanh toán'}
                  </h3>

                  <div className="space-y-4 mb-8 flex-grow overflow-y-auto">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        placeholder="Nhập họ tên của bạn"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    {/* Payment method – only for paid plans */}
                    {selectedPlan.price.includes('đ') && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Phương thức thanh toán
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <button
                            onClick={() => setPaymentMethod('qr_transfer')}
                            className={cn(
                              'border-2 rounded-lg p-3 flex items-center gap-2 cursor-pointer transition-colors',
                              paymentMethod === 'qr_transfer'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                            )}
                          >
                            <QrCode className={cn('w-5 h-5', paymentMethod === 'qr_transfer' ? 'text-blue-600' : 'text-gray-500')} />
                            <span className={cn('font-medium text-sm', paymentMethod === 'qr_transfer' ? 'text-blue-900' : 'text-gray-700')}>
                              Chuyển khoản QR
                            </span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('credit_card')}
                            className={cn(
                              'border-2 rounded-lg p-3 flex items-center gap-2 cursor-pointer transition-colors',
                              paymentMethod === 'credit_card'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                            )}
                          >
                            <CreditCard className={cn('w-5 h-5', paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-500')} />
                            <span className={cn('font-medium text-sm', paymentMethod === 'credit_card' ? 'text-blue-900' : 'text-gray-700')}>
                              Thẻ tín dụng
                            </span>
                          </button>
                        </div>

                        {paymentMethod === 'qr_transfer' && (
                          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center border border-gray-100">
                            <div className="text-center">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SmartRE-${selectedPlan.name}-${selectedPlan.price}-${user?.id}`}
                                alt="Payment QR"
                                className="w-32 h-32 mx-auto mb-3 rounded-lg shadow-sm bg-white p-2"
                              />
                              <p className="text-xs text-gray-500">
                                Quét mã QR bằng ứng dụng ngân hàng
                                <br />
                                Nội dung: <strong>SmartRE {selectedPlan.name} {user?.id}</strong>
                              </p>
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'credit_card' && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
                            <p className="font-medium text-gray-900 mb-2">Thông tin thẻ</p>
                            <input placeholder="Số thẻ" className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <div className="grid grid-cols-2 gap-2">
                              <input placeholder="MM/YY" className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                              <input placeholder="CVV" className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mt-3">
                          ⚠️ Sau khi chuyển khoản, vui lòng chờ Quản trị viên xác nhận thanh toán để kích hoạt gói dịch vụ (thường trong 24 giờ).
                        </p>
                      </div>
                    )}

                    {/* Enterprise - contact note */}
                    {selectedPlan.id === 'enterprise' && (
                      <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-700">
                        Đội ngũ tư vấn sẽ liên hệ bạn qua số điện thoại trong vòng <strong>24 giờ làm việc</strong> để trao đổi chi tiết.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedPlan(null)}
                      disabled={submitState === 'loading'}
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleConfirm}
                      disabled={submitState === 'loading'}
                    >
                      {submitState === 'loading' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi...
                        </span>
                      ) : selectedPlan.id === 'enterprise' ? (
                        'Gửi yêu cầu tư vấn'
                      ) : selectedPlan.id === 'basic' ? (
                        'Đăng ký miễn phí'
                      ) : (
                        'Xác nhận & Gửi yêu cầu'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
