import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { TrendingUp, TrendingDown, Users, Home, DollarSign, Star, RefreshCw, BarChart3 } from 'lucide-react';
import { apiGetMarketStats, MarketStats } from '../../services/api';
import { Button } from '../shared/ui/Button';
import { motion } from 'motion/react';

const COLORS_MAP: Record<string, string> = {
  apartment: '#3b82f6',
  house: '#10b981',
  land: '#f59e0b',
  villa: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Căn hộ',
  house: 'Nhà phố',
  land: 'Đất nền',
  villa: 'Biệt thự',
};

// Fallback data (nếu DB trống)
const FALLBACK_STATS: MarketStats = {
  total_properties: 0,
  total_active: 0,
  avg_price: 0,
  by_type: [],
  by_month: [],
};

export function MarketDashboard() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetMarketStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError('Không thể tải dữ liệu thị trường');
      setStats(FALLBACK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const s = stats || FALLBACK_STATS;

  const statCards = [
    {
      title: 'Giá trung bình',
      value: s.avg_price > 0
        ? s.avg_price >= 1000
          ? `${(s.avg_price / 1000).toFixed(1)} tỷ`
          : `${s.avg_price.toFixed(0)} tr`
        : 'N/A',
      subtext: 'triệu đồng/BĐS',
      isUp: true,
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Tổng tin đăng',
      value: s.total_properties.toLocaleString('vi-VN'),
      subtext: `${s.total_active} đang hiển thị`,
      isUp: true,
      icon: <Home className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      title: 'Tổng người dùng',
      value: ((stats as any)?.total_users ?? 0).toLocaleString('vi-VN'),
      subtext: 'thành viên đã đăng ký',
      isUp: true,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      title: 'Điểm đánh giá TB',
      value: ((stats as any)?.avg_rating ?? 0).toFixed(1),
      subtext: `${(stats as any)?.total_reviews ?? 0} lượt đánh giá`,
      isUp: true,
      icon: <Star className="w-5 h-5 text-orange-600" />,
      bg: 'bg-orange-50',
    },
  ];

  // Chuẩn bị dữ liệu biểu đồ type
  const typeData = s.by_type.map(t => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: t.count,
    avg: Math.round(t.avg_price),
    color: COLORS_MAP[t.type] || '#94a3b8',
  }));

  // Chuẩn bị dữ liệu biểu đồ tháng
  const monthData = s.by_month.map(m => ({
    month: m.month.replace(/^\d{4}-/, 'T'),
    count: m.count,
  }));

  // Nếu không có dữ liệu tháng, dùng fallback demo
  const chartMonthData = monthData.length > 0 ? monthData : [
    { month: 'T1', count: 2 }, { month: 'T2', count: 3 }, { month: 'T3', count: 5 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Cập nhật lúc {lastRefresh.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="rounded-xl gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error} - Đang hiển thị dữ liệu demo.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 ${stat.bg} rounded-xl`}>{stat.icon}</div>
                  <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stat.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    Live
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                  <h4 className="text-2xl font-bold mt-1">{stat.value}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ số lượng tin đăng theo tháng */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Số lượng tin đăng theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonthData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [`${val} tin`, 'Số lượng']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart phân loại BĐS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bổ loại BĐS</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, props: any) => [
                          `${val} tin - Giá TB: ${(props.payload.avg / 1000).toFixed(1)} tỷ`,
                          props.payload.name
                        ]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {typeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{item.value} tin</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bảng giá TB theo loại */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bảng giá trung bình theo loại hình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}tỷ`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [`${(Number(val) / 1000).toFixed(1)} tỷ`, 'Giá TB']}
                  />
                  <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
