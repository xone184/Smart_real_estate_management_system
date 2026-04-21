import React, { useState } from 'react';
import { Search, Filter, ChevronDown, X, Loader2 } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Card, CardContent } from '../shared/ui/Card';
import { motion } from 'motion/react';
import { apiGetProperties } from '../../services/api';
import { Property } from '../../types';

interface PropertySearchProps {
  onSearchNavigate?: (searchTerm: string, filters: any) => void;
}

export function PropertySearch({ onSearchNavigate }: PropertySearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    price_min: '',
    price_max: '',
    area_min: '',
    area_max: '',
    bedrooms: '',
    direction: '',
  });

  const handleSearch = () => {
    if (onSearchNavigate) {
      onSearchNavigate(searchTerm.trim(), filters);
    }
  };

  const handleQuickTag = (tag: string, isCity = false) => {
    if (isCity) {
      const newFilters = { ...filters, city: tag };
      setFilters(newFilters);
      if (onSearchNavigate) onSearchNavigate(searchTerm.trim(), newFilters);
    } else {
      setSearchTerm(tag);
      if (onSearchNavigate) onSearchNavigate(tag, filters);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="w-full max-w-4xl mx-auto -mt-8 relative z-20 px-4">
      <Card className="shadow-2xl border-none">
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-3 bg-gray-50 rounded-xl">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm theo địa điểm, dự án..." 
                className="w-full py-4 bg-transparent outline-none text-gray-700 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); }} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl px-6 h-auto flex items-center gap-2 border-gray-200"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Lọc
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </Button>
              <Button 
                className="rounded-xl px-8 h-auto font-bold bg-blue-600 hover:bg-blue-700"
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 mt-4">
                <select 
                  value={filters.type} 
                  onChange={e => setFilters({...filters, type: e.target.value})}
                  className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Loại hình (Tất cả)</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="house">Nhà phố</option>
                  <option value="villa">Biệt thự</option>
                  <option value="land">Đất nền</option>
                </select>

                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Giá từ (Triệu)" 
                    value={filters.price_min}
                    onChange={e => setFilters({...filters, price_min: e.target.value})}
                    className="w-1/2 p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Đến (Triệu)" 
                    value={filters.price_max}
                    onChange={e => setFilters({...filters, price_max: e.target.value})}
                    className="w-1/2 p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                   <input 
                    type="number" 
                    placeholder="Diện tích từ (m2)" 
                    value={filters.area_min}
                    onChange={e => setFilters({...filters, area_min: e.target.value})}
                    className="w-1/2 p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Đến (m2)" 
                    value={filters.area_max}
                    onChange={e => setFilters({...filters, area_max: e.target.value})}
                    className="w-1/2 p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select 
                   value={filters.bedrooms} 
                   onChange={e => setFilters({...filters, bedrooms: e.target.value})}
                   className="w-full p-3 border border-gray-100 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Số phòng ngủ</option>
                  <option value="1">1+ phòng ngủ</option>
                  <option value="2">2+ phòng ngủ</option>
                  <option value="3">3+ phòng ngủ</option>
                  <option value="4">4+ phòng ngủ</option>
                </select>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick location tags */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {([
          { label: '🏙️ Hà Nội',   city: 'Hà Nội' },
          { label: '🌆 TP.HCM',   city: 'TP.HCM' },
          { label: '🌊 Đà Nẵng',  city: 'Đà Nẵng' },
          { label: '🏖️ Nha Trang', city: 'Khánh Hòa' },
          { label: '🏝️ Phú Quốc', city: 'Kiên Giang' },
          { label: '🌺 Hội An',   city: 'Quảng Nam' },
          { label: '🏭 Bình Dương', city: 'Bình Dương' },
          { label: '🌿 Cần Thơ',  city: 'Cần Thơ' },
        ] as { label: string; city: string }[]).map(({ label, city }) => (
          <button
            key={city}
            onClick={() => handleQuickTag(city, true)}
            className={cn(
              'px-4 py-1.5 backdrop-blur-md border rounded-full text-xs font-medium transition-all shadow-sm',
              filters.city === city
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                : 'bg-white/80 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: { 
  label: string; 
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{label}</label>
      <select 
        className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
