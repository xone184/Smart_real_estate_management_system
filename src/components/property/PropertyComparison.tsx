import React from 'react';
import { Property } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { X, Check, Minus, Square, Bed, Bath, Compass, FileText } from 'lucide-react';

interface PropertyComparisonProps {
  properties: Property[];
  onRemove: (id: number) => void;
  onClose: () => void;
}

export function PropertyComparison({ properties, onRemove, onClose }: PropertyComparisonProps) {
  if (properties.length === 0) return null;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)} tỷ`;
    }
    return `${price} triệu`;
  };

  const features = [
    { key: 'price', label: 'Giá bán', icon: null, format: (v: number) => formatPrice(v) },
    { key: 'area', label: 'Diện tích', icon: <Square className="w-4 h-4" />, format: (v: number) => `${v} m²` },
    { key: 'bedrooms', label: 'Phòng ngủ', icon: <Bed className="w-4 h-4" />, format: (v: number) => v.toString() },
    { key: 'bathrooms', label: 'Phòng tắm', icon: <Bath className="w-4 h-4" />, format: (v: number) => v.toString() },
    { key: 'direction', label: 'Hướng', icon: <Compass className="w-4 h-4" />, format: (v: string) => v },
    { key: 'legal', label: 'Pháp lý', icon: <FileText className="w-4 h-4" />, format: (v: string) => v === 'pink_book' ? 'Sổ hồng' : 'Sổ đỏ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-[2.5rem] shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b p-6">
          <CardTitle className="text-2xl font-bold">So sánh bất động sản</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="w-6 h-6" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-left border-r w-48 sticky left-0 bg-gray-50/50 backdrop-blur-sm z-10">Đặc điểm</th>
                {properties.map((prop) => (
                  <th key={prop.id} className="p-6 min-w-[250px] border-r relative group">
                    <button 
                      onClick={() => onRemove(prop.id)}
                      className="absolute top-2 right-2 p-1 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img 
                      src={prop.images[0]} 
                      className="w-full h-32 object-cover rounded-2xl mb-4 shadow-sm"
                      alt={prop.title}
                      referrerPolicy="no-referrer"
                    />
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 text-left">{prop.title}</h4>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={feature.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="p-6 border-r font-medium text-gray-500 text-sm sticky left-0 bg-inherit backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      {feature.icon}
                      {feature.label}
                    </div>
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-6 border-r text-sm font-bold text-gray-900">
                      {feature.format((prop as any)[feature.key] as never)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-6 border-r font-medium text-gray-500 text-sm sticky left-0 bg-white z-10">Tiện ích</td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-6 border-r">
                    <div className="flex flex-wrap gap-1">
                      {prop.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
        
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Đóng</Button>
          <Button variant="primary" className="rounded-xl bg-blue-600 hover:bg-blue-700">Liên hệ tất cả</Button>
        </div>
      </Card>
    </div>
  );
}
