import React, { useState, useEffect, useCallback } from 'react';
import { Property } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Bed, Bath, Square, MapPin, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ITEMS_PER_PAGE = 6;
const AUTO_ADVANCE_MS = 5_000;

interface PropertySimilarProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

export function PropertySimilar({ properties, onPropertyClick }: PropertySimilarProps) {
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState(false);

  if (properties.length === 0) return null;

  const goToPage = useCallback((page: number) => {
    const nextPage = ((page % totalPages) + totalPages) % totalPages;
    setDirection(nextPage > currentPage || (currentPage === totalPages - 1 && nextPage === 0) ? 1 : -1);
    setCurrentPage(nextPage);
  }, [currentPage, totalPages]);

  const nextPage = useCallback(() => {
    setDirection(1);
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setDirection(-1);
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    const timer = setInterval(nextPage, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused, totalPages, nextPage]);

  const pageProperties = properties.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Animation variants
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <div
      className="mt-16 space-y-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Bất động sản tương tự</h3>
            <p className="text-sm text-gray-500">Gợi ý dựa trên tiêu chí tìm kiếm của bạn</p>
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={prevPage}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentPage
                      ? 'w-8 h-2.5 bg-blue-600'
                      : 'w-2.5 h-2.5 bg-gray-300 hover:bg-blue-300'
                  }`}
                  aria-label={`Trang ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar (auto-advance indicator) */}
      {totalPages > 1 && (
        <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            key={`progress-${currentPage}-${isPaused}`}
            initial={{ width: '0%' }}
            animate={{ width: isPaused ? undefined : '100%' }}
            transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
          />
        </div>
      )}

      {/* Property cards with page transition */}
      <div className="relative overflow-hidden min-h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {pageProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => onPropertyClick(property)}
                className="group cursor-pointer"
              >
                <Card className="border-gray-50 shadow-sm overflow-hidden group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={property.images[0]} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={property.title} 
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase text-blue-600 shadow-sm">
                      {property.type === 'apartment' ? 'Căn hộ' : property.type === 'house' ? 'Nhà phố' : property.type === 'villa' ? 'Biệt thự' : 'Đất nền'}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-xl">
                      <p className="text-white font-bold text-lg">{(property.price / 1000).toFixed(1)} tỷ</p>
                      <p className="text-gray-300 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {property.address.split(',').pop()?.trim()}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="font-bold text-gray-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{property.title}</h4>
                    <div className="flex items-center justify-between text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Square className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold">{property.area}m²</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold">{property.bathrooms}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
