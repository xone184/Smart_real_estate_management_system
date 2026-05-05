import React, { useState } from 'react';
import { Property } from "@/src/types";
import { Card, CardContent, CardFooter } from "../shared/ui/Card";
import { Bed, Bath, Square, MapPin, Layers, Heart } from "lucide-react";
import { motion } from "motion/react";
import { PropertyVerification } from "./PropertyVerification";
import { apiSaveProperty, apiUnsaveProperty } from '../../services/api';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  onToggleComparison?: (e: React.MouseEvent) => void;
  isComparing?: boolean;
  isLoggedIn?: boolean;
  initialSaved?: boolean;
  onToggleSave?: (propertyId: number, saved: boolean) => void;
}

export function PropertyCard({ property, onClick, onToggleComparison, isComparing, isLoggedIn, initialSaved = false, onToggleSave }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);

  React.useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);
  const [savingLoading, setSavingLoading] = useState(false);

  const fallbackImage = 'https://picsum.photos/seed/realestate/800/600';

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)} tỷ`;
    }
    return `${price} triệu`;
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để lưu bất động sản yêu thích!');
      return;
    }
    if (savingLoading) return;

    setSavingLoading(true);
    try {
      if (isSaved) {
        await apiUnsaveProperty(property.id);
        setIsSaved(false);
        onToggleSave?.(property.id, false);
      } else {
        await apiSaveProperty(property.id);
        setIsSaved(true);
        onToggleSave?.(property.id, true);
      }
    } catch (err) {
      console.error('Save property error:', err);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setSavingLoading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    house: 'Nhà phố',
    apartment: 'Căn hộ',
    land: 'Đất nền',
    villa: 'Biệt thự',
  };

  const typeColors: Record<string, string> = {
    house: 'bg-indigo-600',
    apartment: 'bg-emerald-600',
    land: 'bg-amber-600',
    villa: 'bg-purple-600',
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={property.images[0] || fallbackImage}
            alt={property.title}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImage; }}
            className="object-cover w-full h-full transition-transform hover:scale-110 duration-500"
            referrerPolicy="no-referrer"
          />
          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className={cn(
              "text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider w-fit shadow-sm",
              typeColors[property.type] || 'bg-blue-600'
            )}>
              {typeLabels[property.type] || property.type}
            </div>
            <PropertyVerification status="verified" variant="compact" />
          </div>

          {/* Top Right Buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleToggleSave}
              title={isLoggedIn ? (isSaved ? 'Xóa khỏi yêu thích' : 'Lưu vào yêu thích') : 'Đăng nhập để lưu'}
              className={cn(
                "p-2 rounded-full backdrop-blur-md transition-all shadow-lg",
                isSaved
                  ? "bg-red-500 text-white"
                  : "bg-white/80 text-gray-500 hover:bg-white hover:text-red-400",
                !isLoggedIn && "cursor-pointer opacity-80"
              )}
            >
              {savingLoading
                ? <span className="w-4 h-4 block border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Heart className={cn("w-4 h-4 transition-all", isSaved && "fill-current")} />}
            </motion.button>

            {/* Compare Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComparison?.(e);
              }}
              title={isComparing ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
              className={cn(
                "p-2 rounded-full backdrop-blur-md transition-all shadow-lg",
                isComparing ? "bg-blue-600 text-white" : "bg-white/80 text-gray-600 hover:bg-white"
              )}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-sm font-bold px-3 py-1 rounded-full">
            {formatPrice(property.price)}
          </div>
        </div>

        <CardContent className="p-4 flex-grow">
          <h3 className="font-bold text-lg line-clamp-1 mb-1">{property.title}</h3>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1 text-blue-500" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1 text-blue-500" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1 text-blue-500" />
              <span>{property.area}m²</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t border-gray-50 mt-auto">
          <div className="flex flex-wrap gap-1 mt-3">
            {property.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
