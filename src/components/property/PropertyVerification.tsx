import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface PropertyVerificationProps {
  status: 'verified' | 'pending' | 'unverified';
  variant?: 'full' | 'compact';
}

export function PropertyVerification({ status, variant = 'full' }: PropertyVerificationProps) {
  const isCompact = variant === 'compact';

  if (status === 'verified') {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "flex items-center gap-2 bg-green-50 rounded-2xl border border-green-100 shadow-sm shadow-green-50 group cursor-help relative",
          isCompact ? "px-2 py-1 gap-1" : "px-4 py-2"
        )}
      >
        <div className={cn(
          "bg-green-500 rounded-full text-white shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center",
          isCompact ? "p-0.5" : "p-1.5"
        )}>
          <ShieldCheck className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "font-bold text-green-700 uppercase tracking-wider",
            isCompact ? "text-[8px]" : "text-xs"
          )}>
            Tin đăng đã xác thực
          </span>
          {!isCompact && (
            <span className="text-[10px] text-green-600/70 font-bold">Bởi SmartEstate AI & Chuyên viên</span>
          )}
        </div>
        
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-gray-900 text-white rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">Quy trình xác thực 5 bước</span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Kiểm tra sổ đỏ/sổ hồng gốc</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Xác minh danh tính chủ sở hữu</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Đối chiếu quy hoạch thực tế</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Kiểm tra tình trạng tranh chấp</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Chụp ảnh & Quay video thực tế</li>
          </ul>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-gray-900" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-100",
      isCompact ? "px-2 py-1 gap-1" : "px-4 py-2"
    )}>
      <Info className={isCompact ? "w-3 h-3 text-gray-400" : "w-4 h-4 text-gray-400"} />
      <span className={cn(
        "font-bold text-gray-500 uppercase tracking-wider",
        isCompact ? "text-[8px]" : "text-xs"
      )}>
        Đang chờ xác thực
      </span>
    </div>
  );
}
