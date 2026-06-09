import React, { useState, useEffect } from 'react';
import {
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { TrendingUp, TrendingDown, Users, Home, DollarSign, Star, RefreshCw, BarChart3, Newspaper, Award, MapPin, Sparkles } from 'lucide-react';
import { apiGetMarketStats, apiGetMarketTrends, MarketStats, MarketTrendsData } from '../../services/api';
import { Button } from '../shared/ui/Button';
import { motion } from 'motion/react';
import { useActivityTracker } from '../../hooks/useActivityTracker';

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

interface MarketDashboardProps {
  userRole?: string;
}

export function MarketDashboard({ userRole }: MarketDashboardProps) {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [trends, setTrends] = useState<MarketTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // AI Recommendations
  const [recommendedNews, setRecommendedNews] = useState<any[]>([]);
  const [socialTrends, setSocialTrends] = useState<any>(null);
  
  const { trackActivity } = useActivityTracker();
  
  // Date filters for system stats
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchStats();
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchTrends();
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/smart-real-estate-management-system/api/ai/recommend.php');
      const json = await res.json();
      if (json.status === 'success') {
        setRecommendedNews(json.data.recommended_news || []);
        setSocialTrends(json.data.social_trends || null);
      }
    } catch (e) {
      console.error('Error fetching AI recommendations', e);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetMarketStats({ from: fromDate, to: toDate });
      setStats(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError('Không thể tải dữ liệu thị trường');
      setStats(FALLBACK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    setTrendsLoading(true);
    try {
      const data = await apiGetMarketTrends();
      setTrends(data);
    } catch (err) {
      console.error('Không thể tải xu hướng thị trường từ internet:', err);
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchStats();
    fetchTrends();
    fetchRecommendations();
  };

  const s = stats || FALLBACK_STATS;

  // Xây dựng danh sách Card thống kê
  const statCards = isAdmin
    ? [
        {
          title: 'Giá trung bình',
          value: s.avg_price > 0
            ? s.avg_price >= 1000
              ? `${(s.avg_price / 1000).toFixed(1)} tỷ`
              : `${s.avg_price.toFixed(0)} tr`
            : 'N/A',
          subtext: 'triệu đồng/BĐS (hệ thống)',
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
      ]
    : [
        {
          title: 'Giá trung bình',
          value: s.avg_price > 0
            ? s.avg_price >= 1000
              ? `${(s.avg_price / 1000).toFixed(1)} tỷ`
              : `${s.avg_price.toFixed(0)} tr`
            : 'N/A',
          subtext: 'triệu đồng/BĐS (hệ thống)',
          isUp: true,
          icon: <DollarSign className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50',
        },
        {
          title: 'Tin thu thập (Internet)',
          value: trends ? `${trends.total_articles} bài viết` : 'Đang tải...',
          subtext: 'Cập nhật từ 5 đầu báo lớn',
          isUp: true,
          icon: <Newspaper className="w-5 h-5 text-indigo-600" />,
          bg: 'bg-indigo-50',
        },
        {
          title: 'Tâm lý thị trường (Internet)',
          value: trends
            ? trends.summary.sentiment === 'bullish'
              ? 'Tích cực'
              : trends.summary.sentiment === 'bearish'
              ? 'Cẩn trọng'
              : 'Trung lập'
            : 'Đang tải...',
          subtext: 'Phân tích tự động bằng AI',
          isUp: trends ? trends.summary.sentiment === 'bullish' : true,
          icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50',
        },
        {
          title: 'Số báo kết nối',
          value: trends ? `${trends.summary.total_sources} nguồn` : 'Đang tải...',
          subtext: 'VnExpress, CafeF, Dantri...',
          isUp: true,
          icon: <Award className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50',
        },
      ];

  // Chuẩn bị dữ liệu biểu đồ type
  const typeData = s.by_type.map(t => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: t.count,
    avg: Math.round(t.avg_price),
    color: COLORS_MAP[t.type] || '#94a3b8',
  }));

  // Phân bổ loại BĐS: Admin dùng hệ thống, User/Agent dùng Internet
  const pieChartData = isAdmin
    ? typeData
    : (trends?.type_distribution.map(t => ({
        name: t.name,
        value: t.count,
        color: t.color,
      })) || []);

  // Chuẩn bị dữ liệu biểu đồ tháng (6 tháng gần nhất nếu không có filter)
  const chartMonthData: any[] = [];
  if (fromDate || toDate) {
    const sortedMonths = [...s.by_month].sort((a, b) => a.month.localeCompare(b.month));
    sortedMonths.forEach(m => {
      const parts = m.month.split('-');
      chartMonthData.push({
        month: `T${parts[1]}`,
        count: m.count,
      });
    });
  } else {
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yyyy_mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `T${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const found = s.by_month?.find(m => m.month === yyyy_mm);
      chartMonthData.push({
        month: label,
        count: found ? found.count : 0,
      });
    }
  }

  // Chuẩn bị dữ liệu tần suất tin tức theo ngày (Internet)
  const internetTrendData = trends?.daily_trend || [];

  if (loading && trendsLoading && !stats && !trends) {
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
      {/* Header with Filters & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {isAdmin ? (
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Từ ngày</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="text-sm p-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Đến ngày</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="text-sm p-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={() => { setFromDate(''); setToDate(''); }} className="rounded-lg h-[34px]" disabled={!fromDate && !toDate}>
                Xoá lọc
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            Đang hiển thị Xu hướng Thị trường tổng hợp Thời gian thực từ Internet
          </div>
        )}
        
        <div className="flex items-center gap-3 pt-5 md:pt-0">
          <p className="text-xs text-gray-400 hidden lg:block">
            Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} className="rounded-xl gap-2" disabled={loading || trendsLoading}>
            <RefreshCw className={loading || trendsLoading ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            {loading || trendsLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
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
                  <h4 className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ chính bên trái */}
        {isAdmin ? (
          /* Admin: Số lượng tin đăng hệ thống theo tháng */
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Số lượng tin đăng theo tháng (Hệ thống)
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
        ) : (
          /* User / Agent: Tần suất bài viết BĐS trên báo chí theo ngày (Internet) */
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Newspaper className="w-5 h-5 text-indigo-600" />
                Tần suất thảo luận về BĐS trên báo chí (Internet)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                {internetTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Đang quét dữ liệu báo chí...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={internetTrendData}>
                      <defs>
                        <linearGradient id="colorInternetCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${val} bài viết`, 'Tần suất']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorInternetCount)"
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Biểu đồ phân bổ loại BĐS (Phải) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">
              {isAdmin ? 'Phân bổ loại BĐS (Hệ thống)' : 'Phân bổ mối quan tâm (Internet)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, props: any) => [
                          isAdmin
                            ? `${val} tin - Giá TB: ${(props.payload.avg / 1000).toFixed(1)} tỷ`
                            : `${val} bài viết đề cập`,
                          props.payload.name
                        ]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {pieChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {item.value} {isAdmin ? 'tin' : 'bài'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User / Agent: Khu vực & Chủ đề BĐS nóng từ báo chí */}
      {!isAdmin && trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Khu vực BĐS được nhắc đến nhiều nhất */}
          {trends.hot_areas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  Khu vực BĐS được truyền thông quan tâm nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.hot_areas.slice(0, 5).map((area, index) => (
                    <div key={area.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{area.name}</span>
                      </div>
                      <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                        {area.count} lượt nhắc
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chủ đề thảo luận nhiều nhất */}
          {trends.hot_topics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Chủ đề thị trường được nhắc đến nhiều nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.hot_topics.slice(0, 5).map((topic, index) => (
                    <div key={topic.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }} />
                        <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${topic.color}15`, color: topic.color }}>
                        {topic.count} bài viết
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Bảng giá trung bình theo loại hình (Hệ thống) */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Bảng giá trung bình theo loại hình (Hệ thống)</CardTitle>
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

      {/* Tin tức thị trường BĐS trực tuyến thu thập từ Internet */}
      {trends && trends.articles && (
        <Card>
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
              <Newspaper className="w-5 h-5 text-indigo-600 animate-pulse" />
              Tin tức thị trường BĐS trực tuyến (Tổng hợp từ Internet)
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              Hệ thống tự động quét RSS feeds từ VnExpress, CafeF, VietnamNet, Thanh Niên, Dân Trí mỗi 15 phút
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100 pr-2">
              {trends.articles.map((art) => (
                <div key={art.id} className="p-5 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white tracking-wide uppercase"
                      style={{ backgroundColor: trends.sources.find(s => s.key === art.source_key)?.color || '#6b7280' }}
                    >
                      {art.source}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {art.date_label}
                    </span>
                  </div>
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackActivity('click_news', art.id, { title: art.title, source: art.source })}
                    className="text-gray-900 font-bold hover:text-blue-600 text-sm sm:text-base transition-colors leading-snug block mb-1.5"
                  >
                    {art.title}
                  </a>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {art.snippet}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Section */}
      {recommendedNews.length > 0 && (
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="border-b border-blue-100/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Tin tức đề xuất cho bạn (AI)
            </CardTitle>
            <p className="text-xs text-blue-600/70 mt-1">
              Dựa trên hành vi truy cập và sở thích của bạn
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {recommendedNews.map((news, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg mb-2">
                    Đề xuất
                  </span>
                  <a 
                    href={news.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackActivity('click_news', news.id, { title: news.title, source: news.source })}
                    className="block font-bold text-gray-900 hover:text-blue-600 text-sm mb-2 line-clamp-3"
                  >
                    {news.title}
                  </a>
                  <p className="text-xs text-gray-500 line-clamp-2">{news.snippet}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Trends (Mock) */}
      {!isAdmin && socialTrends && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Xu hướng Facebook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialTrends.facebook?.map((trend: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                    #{trend}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-900 text-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-pink-500" />
                Xu hướng TikTok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialTrends.tiktok?.map((trend: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-800 text-gray-200 rounded-xl text-sm font-medium border border-gray-700">
                    #{trend}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Xu hướng Reddit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialTrends.reddit?.map((trend: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium border border-orange-100">
                    r/{trend.replace(/ /g, '_')}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-900">
                <TrendingUp className="w-4 h-4 text-red-600" />
                Tìm kiếm Google
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialTrends.google?.map((trend: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                    🔍 {trend}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-900">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Báo chí (Google News)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialTrends.google_news?.map((trend: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
                    📰 {trend}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}