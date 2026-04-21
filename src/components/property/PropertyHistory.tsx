import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { TrendingUp, TrendingDown, Info, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const historyData = [
  { month: 'T10/2025', price: 4200 },
  { month: 'T11/2025', price: 4350 },
  { month: 'T12/2025', price: 4300 },
  { month: 'T01/2026', price: 4500 },
  { month: 'T02/2026', price: 4650 },
  { month: 'T03/2026', price: 4800 },
];

export function PropertyHistory() {
  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Lịch sử giá & Biến động thị trường
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-white rounded-xl text-green-600 shadow-sm mb-3">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Tăng trưởng (6 tháng)</p>
            <p className="text-2xl font-bold text-green-900">+14.2%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">Giá trung bình khu vực</p>
            <p className="text-2xl font-bold text-blue-900">~ 65tr/m²</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm mb-3">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">Dự báo (3 tháng tới)</p>
            <p className="text-2xl font-bold text-orange-900">+2.5%</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 500', 'dataMax + 500']}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-gray-600 leading-relaxed">
              Dữ liệu được tổng hợp từ <strong>AI Market Insights</strong> dựa trên hơn 10,000 giao dịch thực tế tại khu vực này trong 2 năm qua.
            </p>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:underline">
              Xem báo cáo thị trường chi tiết <Calendar className="w-3 h-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
