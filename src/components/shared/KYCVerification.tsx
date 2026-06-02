import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  Image as ImageIcon,
  User,
  RefreshCw,
  X,
  LogIn,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiSubmitKYC, apiGetKYCStatus } from '../../services/api';

interface KYCVerificationProps {
  onComplete?: () => void;
}

interface UploadState {
  file: File | null;
  preview: string | null;
}

export function KYCVerification({ onComplete }: KYCVerificationProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [kycStatus, setKycStatus] = useState<{ kyc_verified: boolean; document: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await apiGetKYCStatus();
        setKycStatus(status);
        // If already submitted/pending/approved, show step 3
        if (status.document?.status === 'pending' || status.kyc_verified) {
          setStep(3);
        }
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('đăng nhập')) {
          setAuthError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const [idFront, setIdFront] = useState<UploadState>({ file: null, preview: null });
  const [idBack, setIdBack] = useState<UploadState>({ file: null, preview: null });
  const [selfie, setSelfie] = useState<UploadState>({ file: null, preview: null });

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh JPG, PNG, WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File ảnh không được vượt quá 5MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setter({ file, preview: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = (setter: React.Dispatch<React.SetStateAction<UploadState>>, inputRef: React.RefObject<HTMLInputElement | null>) => {
    setter({ file: null, preview: null });
    if (inputRef.current) inputRef.current.value = '';
  };

  const canGoStep2 = idFront.file !== null && idBack.file !== null;
  const canSubmit = selfie.file !== null;

  const handleSubmit = async () => {
    if (!canGoStep2 || !canSubmit) {
      setError('Vui lòng tải đầy đủ ảnh CMND/CCCD (2 mặt) và ảnh chân dung');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (idFront.file) formData.append('id_front', idFront.file);
      if (idBack.file) formData.append('id_back', idBack.file);
      if (selfie.file) formData.append('selfie', selfie.file);

      const result = await apiSubmitKYC(formData);
      setSubmitResult({ success: true, message: result.message });
      setStep(3);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('đăng nhập')) {
        setAuthError(true);
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi gửi hồ sơ');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Giấy tờ' },
    { number: 2, label: 'Chân dung' },
    { number: 3, label: 'Hoàn tất' },
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Đang kiểm tra trạng thái xác minh...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="overflow-hidden border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa đăng nhập</h2>
            <p className="text-gray-500 mb-6">
              Bạn cần đăng nhập để thực hiện xác minh danh tính KYC.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-2xl font-bold"
              onClick={onComplete}
            >
              Quay lại đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already verified
  if (kycStatus?.kyc_verified) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="overflow-hidden border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xác minh danh tính</h2>
            <p className="text-gray-500 mb-6">
              Tài khoản của bạn đã được xác minh KYC thành công.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-2xl font-bold"
              onClick={onComplete}
            >
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Xác minh danh tính</h1>
        <p className="text-gray-500">Để đảm bảo an toàn và tin cậy, vui lòng hoàn thành xác minh KYC</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 gap-0">
        {steps.map((s, idx) => (
          <React.Fragment key={s.number}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step > s.number ? 'bg-green-500 text-white' :
                step === s.number ? 'bg-blue-600 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
              </div>
              <span className={`text-xs mt-1 font-medium ${step === s.number ? 'text-blue-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-4 transition-all ${step > idx + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card className="overflow-hidden border-none shadow-xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">

            {/* Step 1: Upload CMND/CCCD */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Bước 1: Tải ảnh CMND/CCCD</p>
                    <p>Chụp rõ 2 mặt CMND/CCCD hoặc Hộ chiếu. Ảnh phải rõ nét, không bị mờ hay che khuất thông tin.</p>
                  </div>
                </div>

                {/* ID Front */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Mặt trước CMND/CCCD *</p>
                  {idFront.preview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-green-200">
                      <img src={idFront.preview} alt="ID Front" className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => clearFile(setIdFront, idFrontRef)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ✓ Đã tải
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => idFrontRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 transition-colors">
                        <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click để chọn ảnh mặt trước</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Tối đa 5MB</p>
                    </div>
                  )}
                  <input
                    ref={idFrontRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={e => handleFileChange(e, setIdFront)}
                  />
                </div>

                {/* ID Back */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Mặt sau CMND/CCCD *</p>
                  {idBack.preview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-green-200">
                      <img src={idBack.preview} alt="ID Back" className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => clearFile(setIdBack, idBackRef)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ✓ Đã tải
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => idBackRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 transition-colors">
                        <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click để chọn ảnh mặt sau</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Tối đa 5MB</p>
                    </div>
                  )}
                  <input
                    ref={idBackRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={e => handleFileChange(e, setIdBack)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-base font-bold disabled:opacity-50"
                  onClick={() => { setError(''); setStep(2); }}
                  disabled={!canGoStep2}
                >
                  Tiếp tục <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {!canGoStep2 && (
                  <p className="text-xs text-center text-gray-400">Vui lòng tải đủ 2 mặt CMND/CCCD để tiếp tục</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Selfie */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <Camera className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Bước 2: Chụp ảnh chân dung</p>
                    <p>Chụp ảnh khuôn mặt thẳng, đủ ánh sáng, không đeo kính tối. Ảnh phải thấy rõ toàn bộ khuôn mặt.</p>
                  </div>
                </div>

                {/* Selfie Upload */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Ảnh chân dung *</p>
                  {selfie.preview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-green-200">
                      <img src={selfie.preview} alt="Selfie" className="w-full h-56 object-cover object-top" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => clearFile(setSelfie, selfieRef)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ✓ Đã tải
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => selfieRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-colors">
                        <User className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click để chọn ảnh chân dung</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Tối đa 5MB</p>
                    </div>
                  )}
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={e => handleFileChange(e, setSelfie)}
                  />
                </div>

                {/* Preview giấy tờ đã upload */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-gray-100">
                    <img src={idFront.preview!} alt="" className="w-full h-20 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center">Mặt trước</div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-gray-100">
                    <img src={idBack.preview!} alt="" className="w-full h-20 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center">Mặt sau</div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl"
                    onClick={() => setStep(1)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>Gửi hồ sơ <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                {kycStatus?.kyc_verified || kycStatus?.document?.status === 'approved' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <ShieldCheck className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản đã xác thực</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      Tài khoản của bạn đã được xác thực danh tính (KYC) thành công.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-2xl font-bold"
                      onClick={onComplete}
                    >
                      Quay lại trang chủ
                    </Button>
                  </>
                ) : kycStatus?.document?.status === 'rejected' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <AlertCircle className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu bị từ chối</h2>
                    <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                      Yêu cầu xác thực tài khoản của bạn đã bị từ chối.
                    </p>
                    {kycStatus.document?.notes && (
                      <div className="bg-red-50 text-red-800 p-4 rounded-xl max-w-md mx-auto mb-6 text-sm text-left border border-red-100">
                        <span className="font-bold">Lý do từ chối:</span> {kycStatus.document.notes}
                      </div>
                    )}
                    <div className="flex justify-center gap-3">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 rounded-2xl font-bold"
                        onClick={() => {
                          setStep(1);
                          setIdFront({ file: null, preview: null });
                          setIdBack({ file: null, preview: null });
                          setSelfie({ file: null, preview: null });
                        }}
                      >
                        Gửi lại hồ sơ mới
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl font-bold"
                        onClick={onComplete}
                      >
                        Trang chủ
                      </Button>
                    </div>
                  </>
                ) : kycStatus?.document?.status === 'pending' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Clock className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ đang chờ xác minh</h2>
                    <p className="text-gray-500 mb-2 max-w-sm mx-auto">
                      Hồ sơ KYC của bạn đã được gửi và đang được xem xét. Kết quả sẽ có trong vòng 5-10 phút.
                    </p>
                    <p className="text-sm text-blue-600 font-medium mb-8">
                      Bạn sẽ nhận được thông báo khi quá trình xác minh hoàn tất.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-2xl font-bold"
                      onClick={onComplete}
                    >
                      Quay lại trang chủ
                    </Button>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ đã được gửi!</h2>
                    <p className="text-gray-500 mb-2 max-w-sm mx-auto">
                      Hệ thống đang kiểm tra thông tin của bạn. Kết quả sẽ có trong vòng 5-10 phút.
                    </p>
                    <p className="text-sm text-blue-600 font-medium mb-8">
                      Bạn sẽ nhận được thông báo khi quá trình xác minh hoàn tất.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-2xl font-bold"
                      onClick={onComplete}
                    >
                      Quay lại trang chủ
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
        <div className="text-xs text-orange-800 leading-relaxed">
          <p className="font-bold mb-1">Lưu ý bảo mật:</p>
          Chúng tôi cam kết bảo mật thông tin cá nhân của bạn theo tiêu chuẩn quốc tế.
          Dữ liệu chỉ được sử dụng cho mục đích xác minh danh tính trên nền tảng.
        </div>
      </div>
    </div>
  );
}
