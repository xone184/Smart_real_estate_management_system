import React, { useState, useEffect } from 'react';
import { Property } from '@/src/types';
import { PropertyCard } from '../property/PropertyCard';
import { apiGetProperties } from '../../services/api';
import { Search, Filter, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { motion } from 'motion/react';

interface SearchResultsPageProps {
  initialSearch?: string;
  initialFilters?: any;
  onNavigate?: (page: string) => void;
  onPropertyClick?: (property: Property) => void;
  user?: any;
  savedPropertyIds?: number[];
  onToggleSave?: (id: number, saved: boolean) => void;
}

export function SearchResultsPage({ 
  initialSearch = '', 
  initialFilters = null,
  onNavigate, 
  onPropertyClick,
  user,
  savedPropertyIds = [],
  onToggleSave
}: SearchResultsPageProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  
  const [filters, setFilters] = useState({
    type: initialFilters?.type || '',
    city: initialFilters?.city || '',
    price_min: initialFilters?.price_min || '',
    price_max: initialFilters?.price_max || '',
    area_min: initialFilters?.area_min || '',
    area_max: initialFilters?.area_max || '',
    bedrooms: initialFilters?.bedrooms || '',
    direction: initialFilters?.direction || '',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const apiFilters: any = {};
      if (searchTerm.trim()) apiFilters.search = searchTerm.trim();
      
      if (filters.type) apiFilters.type = filters.type;
      if (filters.city) apiFilters.city = filters.city;
      if (filters.price_min) apiFilters.price_min = Number(filters.price_min);
      if (filters.price_max) apiFilters.price_max = Number(filters.price_max);
      if (filters.area_min) apiFilters.area_min = Number(filters.area_min);
      if (filters.area_max) apiFilters.area_max = Number(filters.area_max);
      if (filters.bedrooms) apiFilters.bedrooms = Number(filters.bedrooms);
      if (filters.direction) apiFilters.direction = filters.direction;

      const results = await apiGetProperties({ ...apiFilters, status: 'active' });
      setProperties(results as Property[]);
    } catch (error) {
      console.error('Fetch search results failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchResults();
    setShowMobileFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      city: '',
      price_min: '',
      price_max: '',
      area_min: '',
      area_max: '',
      bedrooms: '',
      direction: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <button onClick={() => onNavigate?.('home')} className="hover:text-blue-600 transition-colors">
          Trang chủ
        </button>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-medium">Kết quả tìm kiếm</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className={cn(
          "lg:w-1/4 lg:block space-y-6",
          showMobileFilters ? "block fixed inset-0 z-50 bg-white p-4 overflow-y-auto" : "hidden"
        )}>
          {showMobileFilters && (
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h2 className="text-xl font-bold">Bộ lọc</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 border rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Tìm kiếm nâng cao
            </h3>
            
            <div className="space-y-5">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Loại hình</label>
                <select 
                  value={filters.type} 
                  onChange={e => setFilters({...filters, type: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả loại hình</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="house">Nhà phố</option>
                  <option value="villa">Biệt thự</option>
                  <option value="land">Đất nền</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">📍 Tỉnh / Thành phố</label>
                <select
                  value={filters.city}
                  onChange={e => setFilters({...filters, city: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toàn quốc</option>
                  <optgroup label="── Miền Bắc ──">
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hưng Yên">Hưng Yên</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Quảng Ninh">Quảng Ninh</option>
                    <option value="Bắc Ninh">Bắc Ninh</option>
                    <option value="Vĩnh Phúc">Vĩnh Phúc</option>
                  </optgroup>
                  <optgroup label="── Miền Trung ──">
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Quảng Nam">Quảng Nam (Hội An)</option>
                    <option value="Thừa Thiên Huế">Huế</option>
                    <option value="Khánh Hòa">Khánh Hòa (Nha Trang)</option>
                    <option value="Bình Định">Bình Định</option>
                  </optgroup>
                  <optgroup label="── Miền Nam ──">
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="Long An">Long An</option>
                    <option value="Bà Rịa">Bà Rịa – Vũng Tàu</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Kiên Giang">Kiên Giang (Phú Quốc)</option>
                  </optgroup>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Mức giá (Triệu VNĐ)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Tử" 
                    value={filters.price_min}
                    onChange={e => setFilters({...filters, price_min: e.target.value})}
                    className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Đến" 
                    value={filters.price_max}
                    onChange={e => setFilters({...filters, price_max: e.target.value})}
                    className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Area Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Diện tích (m²)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Tử" 
                    value={filters.area_min}
                    onChange={e => setFilters({...filters, area_min: e.target.value})}
                    className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Đến" 
                    value={filters.area_max}
                    onChange={e => setFilters({...filters, area_max: e.target.value})}
                    className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bedrooms Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Số phòng ngủ</label>
                <select 
                  value={filters.bedrooms} 
                  onChange={e => setFilters({...filters, bedrooms: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="1">Từ 1 phòng</option>
                  <option value="2">Từ 2 phòng</option>
                  <option value="3">Từ 3 phòng</option>
                  <option value="4">Từ 4 phòng trớ lên</option>
                </select>
              </div>

              {/* Direction Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Hướng nhà</label>
                <select 
                  value={filters.direction} 
                  onChange={e => setFilters({...filters, direction: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả hướng</option>
                  <option value="Đông">Đông</option>
                  <option value="Tây">Tây</option>
                  <option value="Nam">Nam</option>
                  <option value="Bắc">Bắc</option>
                  <option value="Đông Nam">Đông Nam</option>
                  <option value="Đông Bắc">Đông Bắc</option>
                  <option value="Tây Nam">Tây Nam</option>
                  <option value="Tây Bắc">Tây Bắc</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Button onClick={handleApplyFilter} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-xl shadow-lg">
                  Áp dụng bộ lọc
                </Button>
                <Button variant="ghost" onClick={handleResetFilters} className="w-full text-gray-500">
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:w-3/4 flex-grow space-y-6">
          {/* Top Search Bar */}
           <div className="flex gap-2 w-full max-w-2xl bg-white p-2 border border-gray-200 shadow-sm rounded-xl items-center relative z-10">
              <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Nhập địa điểm, dự án hoặc từ khoá cần tìm..." 
                className="w-full py-3 bg-transparent outline-none text-gray-700 font-medium placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
              <Button onClick={() => setShowMobileFilters(true)} className="lg:hidden p-3 bg-gray-100 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </Button>
              <Button onClick={handleApplyFilter} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 font-semibold shadow-md">
                Tìm
              </Button>
            </div>

          {/* Results Summary and Sorting */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <h1 className="text-xl font-bold flex items-center gap-2">
              Có <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{loading ? '...' : properties.length}</span> kết quả phù hợp
            </h1>
          </div>

          {/* Property Cards Grid */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-[400px] w-full bg-gray-100 animate-pulse rounded-3xl" />
               ))}
             </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
              <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="No results" className="w-48 mx-auto opacity-50 mb-6" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xin lỗi, không có kết quả nào phù hợp.</h3>
              <p className="text-gray-500 mb-6">Bạn hãy thử thay đổi hoặc xoá bỏ các bộ lọc để có nhiều sự lựa chọn hơn.</p>
              <Button onClick={handleResetFilters} variant="outline" className="rounded-xl font-medium border-gray-300">
                Làm mới trang tìm kiếm
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((prop, idx) => (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <PropertyCard 
                    property={prop} 
                    onClick={() => onPropertyClick?.(prop)}
                    isLoggedIn={!!user}
                    initialSaved={savedPropertyIds.includes(prop.id)}
                    onToggleSave={onToggleSave}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
