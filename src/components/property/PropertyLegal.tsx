import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';
import { Button } from '../shared/ui/Button';

interface PropertyLegalProps {
  type: 'pink_book' | 'red_book' | 'contract' | 'other';
  legalScanUrl?: string;
  planningUrl?: string;
}

export function PropertyLegal({ type, legalScanUrl, planningUrl }: PropertyLegalProps) {
  const getLegalInfo = () => {
    switch (type) {
      case 'pink_book':
        return {
          title: 'Sổ hồng riêng',
          description: 'Giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở.',
          status: 'verified',
          color: 'text-pink-600',
          bg: 'bg-pink-50',
          border: 'border-pink-100'
        };
      case 'red_book':
        return {
          title: 'Sổ đỏ chính chủ',
          description: 'Giấy chứng nhận quyền sử dụng đất nông nghiệp, đất lâm nghiệp, đất nuôi trồng thủy sản.',
          status: 'verified',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-100'
        };
      default:
        return {
          title: 'Hợp đồng mua bán',
          description: 'Đang trong quá trình chờ cấp sổ, pháp lý dựa trên hợp đồng với chủ đầu tư.',
          status: 'pending',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-100'
        };
    }
  };

  const info = getLegalInfo();

  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Pháp lý & Hồ sơ
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className={`p-6 rounded-2xl border ${info.border} ${info.bg} relative overflow-hidden`}>
          <div className="flex items-start gap-4 relative z-10">
            <div className={`p-3 rounded-xl bg-white shadow-sm ${info.color}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-lg font-bold ${info.color}`}>{info.title}</h4>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-gray-100 text-[10px] font-bold uppercase text-green-600">
                  <CheckCircle2 className="w-3 h-3" /> Đã kiểm duyệt
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{info.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl bg-white border-gray-100 text-xs font-bold hover:bg-gray-50"
                  onClick={() => {
                    if (!legalScanUrl) {
                      alert('Tin đăng này chưa cập nhật link bản scan pháp lý.');
                      return;
                    }
                    window.open(legalScanUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Download className="w-3 h-3 mr-2" /> Xem bản scan pháp lý
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl bg-white border-gray-100 text-xs font-bold hover:bg-gray-50"
                  onClick={() => {
                    if (!planningUrl) {
                      alert('Tin đăng này chưa cập nhật link quy hoạch khu vực.');
                      return;
                    }
                    window.open(planningUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Info className="w-3 h-3 mr-2" /> Quy hoạch khu vực
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        </div>

        <div className="mt-6 space-y-4">
          <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Các bước kiểm tra an toàn
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-900 mb-1">Kiểm tra quy hoạch</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">Đã đối chiếu với bản đồ quy hoạch mới nhất của thành phố.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-900 mb-1">Xác minh chủ sở hữu</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">Thông tin chủ nhà đã được xác thực qua CCCD và sổ gốc.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-900 mb-1">Tình trạng tranh chấp</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">Không có ghi nhận tranh chấp hoặc kê biên tài sản.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Hệ thống <strong>SmartEstate</strong> cam kết 100% tin đăng đều được xác thực pháp lý trước khi hiển thị.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
