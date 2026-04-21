import React from 'react';
import { Property } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Bed, Bath, Square, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PropertySimilarProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

export function PropertySimilar({ properties, onPropertyClick }: PropertySimilarProps) {
  if (properties.length === 0) return null;

  return (
    <div className="mt-16 space-y-8">
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
        <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
          Xem thêm <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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
                  {property.type === 'apartment' ? 'Căn hộ' : property.type === 'house' ? 'Nhà phố' : 'Đất nền'}
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
      </div>
    </div>
  );
}
