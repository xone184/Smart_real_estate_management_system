import React, { useState } from 'react';
import { Property } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Heart, 
  Phone, 
  Mail, 
  Calendar,
  ShieldCheck,
  Info,
  ExternalLink,
  Box,
  TrendingUp,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';
import { ThreeDViewer } from './ThreeDViewer';
import { PropertyMap } from './PropertyMap';
import { PropertyTour } from './PropertyTour';
import { PropertyReviews } from './PropertyReviews';
import { PropertyHistory } from './PropertyHistory';
import { PropertyMortgage } from './PropertyMortgage';
import { PropertyLegal } from './PropertyLegal';
import { PropertyAmenities } from './PropertyAmenities';
import { PropertyFloorPlan } from './PropertyFloorPlan';
import { PropertyVideo } from './PropertyVideo';
import { PropertyShare } from './PropertyShare';
import { PropertyVerification } from './PropertyVerification';
import { PropertySimilar } from './PropertySimilar';
import { PropertyBreadcrumb } from './PropertyBreadcrumb';
import { PropertyStickyContact } from './PropertyStickyContact';
import { PropertyGallery } from './PropertyGallery';
import { PropertySchedule } from './PropertySchedule';
import { PropertyAgent } from './PropertyAgent';
import ReactMarkdown from 'react-markdown';
import { apiGetSavedProperties, apiSaveProperty, apiUnsaveProperty } from '../../services/api';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  onPropertyClick: (property: Property) => void;
  similarProperties: Property[];
  user?: { id: number; display_name: string; photo_url?: string } | null;
  onToggleSave?: (id: number, saved: boolean) => void;
  initialSaved?: boolean;
}

export function PropertyDetail({ property, onBack, onPropertyClick, similarProperties, user, onToggleSave, initialSaved = false }: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState<'images' | '3d' | 'map' | 'tour'>('images');
  const [isFavorite, setIsFavorite] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  // Sync khi initialSaved thay đổi từ parent
  React.useEffect(() => {
    setIsFavorite(initialSaved);
  }, [initialSaved]);

  // Nếu chưa có initialSaved (không truyền) mà user đã login → kiểm tra từ API
  React.useEffect(() => {
    if (!initialSaved && user) {
      apiGetSavedProperties()
        .then(list => { setIsFavorite(list.some(p => p.id === property.id)); })
        .catch(console.error);
    }
  }, [property.id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu bất động sản!');
      return;
    }
    setIsSaving(true);
    try {
      if (isFavorite) {
        await apiUnsaveProperty(property.id);
        setIsFavorite(false);
        onToggleSave?.(property.id, false);
      } else {
        await apiSaveProperty(property.id);
        setIsFavorite(true);
        onToggleSave?.(property.id, true);
      }
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại sau');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Xem bất động sản: ${property.title} trên SmartRE`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('User cancelled share');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép đường dẫn!');
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)} tỷ`;
    }
    return `${price} triệu`;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      <PropertyBreadcrumb 
        items={[
          { label: property.type === 'apartment' ? 'Căn hộ' : property.type === 'house' ? 'Nhà phố' : 'Đất nền', onClick: onBack },
          { label: property.title }
        ]}
      />

      <Button variant="ghost" onClick={onBack} className="mb-6 group">
        <ChevronLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
        Quay lại danh sách
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Media Viewer */}
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-gray-100 shadow-xl">
              {activeTab === 'images' && (
                <PropertyGallery images={property.images} />
              )}
              {activeTab === '3d' && (
                <div className="aspect-video">
                  <ThreeDViewer imageUrl={property.images[0]} />
                </div>
              )}
              {activeTab === 'map' && (
                <div className="aspect-video">
                  <PropertyMap location={property.location} address={property.address} />
                </div>
              )}
              {activeTab === 'tour' && (
                <div className="aspect-video">
                  <PropertyTour videoUrl={property.video_url} roomImages={property.room_images} />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mx-auto overflow-x-auto max-w-full">
              <TabButton 
                active={activeTab === 'images'} 
                onClick={() => setActiveTab('images')}
                icon={<ImageIcon className="w-4 h-4" />}
                label="Hình ảnh"
              />
              <TabButton 
                active={activeTab === 'tour'} 
                onClick={() => setActiveTab('tour')}
                icon={<Play className="w-4 h-4" />}
                label="Guided Tour"
              />
              <TabButton 
                active={activeTab === '3d'} 
                onClick={() => setActiveTab('3d')}
                icon={<Box className="w-4 h-4" />}
                label="Tour 3D"
              />
              <TabButton 
                active={activeTab === 'map'} 
                onClick={() => setActiveTab('map')}
                icon={<MapPin className="w-4 h-4" />}
                label="Bản đồ"
              />
            </div>
          </div>

          {/* Property Info */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className={cn(
                    "text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider w-fit shadow-sm",
                    property.type === 'house' ? 'bg-indigo-600' :
                    property.type === 'apartment' ? 'bg-emerald-600' :
                    property.type === 'land' ? 'bg-amber-600' :
                    property.type === 'villa' ? 'bg-purple-600' : 'bg-blue-600'
                  )}>
                    {property.type === 'house' ? 'Nhà phố' :
                     property.type === 'apartment' ? 'Căn hộ' :
                     property.type === 'land' ? 'Đất nền' :
                     property.type === 'villa' ? 'Biệt thự' : property.type}
                  </div>
                  <PropertyVerification status="verified" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center text-gray-500 gap-4">
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-blue-500" /> {property.address}</div>
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-blue-500" /> Đăng 2 ngày trước</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={isSaving}
                  title={user ? (isFavorite ? 'Xóa khỏi yêu thích' : 'Lưu vào yêu thích') : 'Đăng nhập để lưu'}
                  className={cn('transition-all', isFavorite ? 'border-red-300 bg-red-50' : '')}
                >
                  {isSaving
                    ? <span className="w-5 h-5 block border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <Heart className={cn('w-5 h-5 transition-colors', isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400')} />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-5 h-5 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoBox icon={<Square className="w-5 h-5" />} label="Diện tích" value={`${property.area} m²`} />
              <InfoBox icon={<Bed className="w-5 h-5" />} label="Phòng ngủ" value={property.bedrooms.toString()} />
              <InfoBox icon={<Bath className="w-5 h-5" />} label="Phòng tắm" value={property.bathrooms.toString()} />
              <InfoBox icon={<ShieldCheck className="w-5 h-5" />} label="Pháp lý" value={property.legal === 'pink_book' ? 'Sổ hồng' : 'Sổ đỏ'} />
            </div>

            <PropertyLegal
              type={property.legal as any}
              legalScanUrl={property.legal_scan_url}
              planningUrl={property.planning_url}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Mô tả chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-blue max-w-none">
                <ReactMarkdown>{property.description}</ReactMarkdown>
              </CardContent>
            </Card>

            <PropertyAmenities />

            <PropertyFloorPlan />

            <PropertyVideo videoUrl={property.video_url} />

            <PropertyReviews propertyId={property.id} user={user} />
          </div>
        </div>

        {/* Right Column: Contact & Valuation */}
        <div className="space-y-6">
          <PropertySchedule propertyId={property.id} user={user} />
          
          <PropertyAgent ownerId={property.owner_id} propertyId={property.id} property={property} />

          <Card className="border-orange-100 bg-orange-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                <TrendingUp className="w-4 h-4" />
                AI Định giá
              </div>
              {property.ai_valuation ? (
                <>
                  <p className="text-2xl font-bold text-orange-700 mb-1">
                    {property.ai_valuation >= 1000
                      ? `${(property.ai_valuation / 1000).toFixed(2)} tỷ`
                      : `${property.ai_valuation} triệu`}
                  </p>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {property.ai_valuation > property.price
                      ? `✅ Bất động sản đang được bán < strong style={{color:'#b45309'}}>thấp hơn</strong> định giá AI khoảng ${formatPrice(property.ai_valuation - property.price)}.`
                      : `⚠️ Giá bán đang <strong>cao hơn</strong> định giá AI khoảng ${formatPrice(property.price - property.ai_valuation)}.`}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-orange-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${Math.min(100, (property.price / property.ai_valuation) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-orange-500 mt-1">
                    <span>Giá bán: {formatPrice(property.price)}</span>
                    <span>AI: {formatPrice(property.ai_valuation)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-orange-700 leading-relaxed">
                  Dựa trên dữ liệu thị trường, bất động sản này có mức giá <strong>hợp lý</strong> so với khu vực xung quanh.
                </p>
              )}
            </CardContent>
          </Card>

          <PropertyHistory />

          <PropertyMortgage price={property.price} />

          <PropertyShare url={window.location.href} title={property.title} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thông tin thêm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã tin:</span>
                <span className="font-medium">RE-{property.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hướng:</span>
                <span className="font-medium">{property.direction || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày đăng:</span>
                <span className="font-medium">
                  {property.created_at
                    ? new Date(property.created_at).toLocaleDateString('vi-VN')
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PropertySimilar 
        properties={similarProperties} 
        onPropertyClick={onPropertyClick} 
      />

      <PropertyStickyContact price={formatPrice(property.price)} />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
        active ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="text-blue-500 mb-2">{icon}</div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ImageIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
