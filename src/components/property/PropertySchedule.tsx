import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Calendar, Clock, User, Phone, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { apiCreateAppointment } from '../../services/api';

interface PropertyScheduleProps {
  propertyId: number;
  user?: any;
}

export function PropertySchedule({ propertyId, user }: PropertyScheduleProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorDesc, setErrorDesc] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);

  const dates = React.useMemo(() => {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const datesList = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
       const d = new Date(today);
       d.setDate(today.getDate() + i);
       
       const baseDayName = dayNames[d.getDay()];
       const dayName = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : baseDayName);
       const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
       const fullStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
       
       datesList.push({ day: dayName, date: dateStr, full: fullStr });
    }
    return datesList;
  }, []);

  const times = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30'];

  const isTimeInPast = (timeStr: string) => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (selectedDate !== todayStr) return false;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (hours < currentHours) return true;
    if (hours === currentHours && minutes <= currentMinutes) return true;
    
    return false;
  };

  return (
    <Card className="border-blue-100 shadow-xl shadow-blue-50/50 overflow-hidden">
      <div className="h-2 bg-blue-600" />
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Đặt lịch xem nhà
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chọn ngày xem</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((d) => (
                    <button
                      key={d.full}
                      onClick={() => {
                        setSelectedDate(d.full);
                        // If current selected time is now in the past for the new date, reset it
                        if (selectedTime && isTimeInPast(selectedTime)) {
                          setSelectedTime(null);
                        }
                      }}
                      className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-2xl border-2 transition-all ${selectedDate === d.full ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105' : 'border-gray-50 hover:border-blue-200 text-gray-500'}`}
                    >
                      <span className="text-[10px] uppercase font-bold mb-1 whitespace-nowrap">{d.day}</span>
                      <span className="text-lg font-bold">{d.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chọn khung giờ</p>
                <div className="grid grid-cols-3 gap-2">
                  {times.map((t) => {
                    const disabled = isTimeInPast(t);
                    return (
                      <button
                        key={t}
                        disabled={disabled}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          disabled ? 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed opacity-60' :
                          selectedTime === t ? 'border-blue-600 bg-blue-50 text-blue-600' : 
                          'border-gray-50 hover:border-blue-200 text-gray-500'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
              >
                Tiếp tục thông tin liên hệ
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Nhập tên của bạn" 
                    defaultValue={user?.display_name || ''}
                    disabled={!!user}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-50 focus:border-blue-600 outline-none font-medium disabled:opacity-50" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" placeholder="Nhập số điện thoại" className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-50 focus:border-blue-600 outline-none font-medium" />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Lịch hẹn: <strong>{selectedTime}</strong> ngày <strong>{selectedDate}</strong>. Chuyên viên sẽ gọi xác nhận trong 15 phút.
                </p>
              </div>

              {errorDesc && <p className="text-red-500 text-sm font-bold text-center">{errorDesc}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="flex-1 h-12 rounded-xl border-gray-100 font-bold">Quay lại</Button>
                <Button 
                  onClick={async () => {
                    if (!user) {
                      setErrorDesc('Vui lòng đăng nhập để đặt lịch');
                      return;
                    }
                    setLoading(true);
                    setErrorDesc('');
                    try {
                      const res = await apiCreateAppointment({
                        property_id: propertyId,
                        visit_date: selectedDate!,
                        time_slot: selectedTime!,
                        message: 'Tôi muốn tham quan căn hộ này'
                      });
                      setBookingId(res.id);
                      setStep(3);
                    } catch (error: any) {
                      setErrorDesc(error.message || 'Lỗi đặt lịch');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  disabled={loading}
                  className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Xác nhận đặt lịch'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Đặt lịch thành công!</h4>
                <p className="text-sm text-gray-500 mt-2">Mã lịch hẹn: <span className="font-mono font-bold text-blue-600">SRE-{bookingId}</span></p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                Chúng tôi đã gửi thông tin chi tiết qua tin nhắn SMS và Zalo của bạn.
              </p>
              <Button onClick={() => setStep(1)} variant="outline" className="h-10 rounded-xl border-gray-100 font-bold">Đặt lịch khác</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Đặt lịch xem nhà hoàn toàn <strong>miễn phí</strong>. Bạn có thể hủy hoặc đổi lịch bất cứ lúc nào trước 2 tiếng.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
