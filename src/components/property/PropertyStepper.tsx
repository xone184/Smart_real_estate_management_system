import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  MapPin, 
  Image as ImageIcon, 
  Cpu, 
  UserCheck, 
  Eye,
  Info,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { generatePropertyDescription, estimatePropertyPrice } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';
import { apiCreateProperty, apiUploadImages } from '../../services/api';
import { UserProfile } from '../../types';

const steps = [
  { id: 1, title: 'Thông tin cơ bản', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Chi tiết', icon: <Info className="w-4 h-4" /> },
  { id: 3, title: 'Vị trí', icon: <MapPin className="w-4 h-4" /> },
  { id: 4, title: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 5, title: 'AI Hỗ trợ', icon: <Cpu className="w-4 h-4" /> },
  { id: 6, title: 'Xác minh KYC', icon: <UserCheck className="w-4 h-4" /> },
  { id: 7, title: 'Hoàn tất', icon: <Eye className="w-4 h-4" /> },
];

interface PropertyStepperProps {
  onComplete?: () => void;
  onNavigate?: (page: string) => void;
  user?: UserProfile | null;
  onRefresh?: () => void;
}

export function PropertyStepper({ onComplete, onNavigate, user, onRefresh }: PropertyStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'house',
    price: 0,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    direction: '',
    legal: 'pink_book',
    address: '',
    description: '',
    images: ['https://picsum.photos/seed/newprop/800/600'], // Default image for demo
    kycId: '',
    video_url: '',
    tour_3d_url: '',
    legal_scan_url: '',
    planning_url: '',
    location_lat: 0,
    location_lng: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiEstimation, setAiEstimation] = useState<any>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geoError, setGeoError] = useState('');

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Geocode address to get coordinates
  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) {
      setGeoError('Vui lòng nhập địa chỉ trước');
      return;
    }

    setIsGeocodingAddress(true);
    setGeoError('');
    
    try {
      const q = encodeURIComponent(`${formData.address}, Việt Nam`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const data = await res.json();
      
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        setFormData({
          ...formData,
          location_lat: parseFloat(data[0].lat),
          location_lng: parseFloat(data[0].lon),
        });
        setGeoError('');
      } else {
        setGeoError('Không tìm thấy địa chỉ. Vui lòng nhập chính xác hơn.');
      }
    } catch (error) {
      setGeoError('Lỗi khi tìm kiếm địa chỉ. Vui lòng nhập tọa độ thủ công.');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng tin');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImages = formData.images;
      if (selectedFiles.length > 0) {
        setUploadProgress('Đang tải ảnh lên hệ thống...');
        const uploadRes = await apiUploadImages(selectedFiles, 'properties');
        finalImages = uploadRes.urls;
      }
      
      setUploadProgress('Đang lưu thông tin...');
      await apiCreateProperty({
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        price: formData.price,
        area: formData.area,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        direction: formData.direction,
        legal: formData.legal,
        address: formData.address,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        video_url: formData.video_url,
        tour_3d_url: formData.tour_3d_url,
        legal_scan_url: formData.legal_scan_url,
        planning_url: formData.planning_url,
        images: finalImages,
        tags: [formData.type, formData.legal],
      });
      
      if (onComplete) onComplete();
      alert('Đã gửi tin đăng thành công! Tin của bạn đang chờ duyệt.');
      if (onRefresh) onRefresh();
      if (onNavigate) onNavigate('home');
    } catch (error: any) {
      alert('Lỗi: ' + (error.message || 'Không thể đăng tin'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArr]);
      
      const previewsArr = filesArr.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previewsArr]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiDescription = async () => {
    setIsGenerating(true);
    const desc = await generatePropertyDescription(
      formData.title,
      formData.type,
      formData.area,
      formData.price,
      formData.address
    );
    setFormData({ ...formData, description: desc || '' });
    setIsGenerating(false);
  };

  const handleAiValuation = async () => {
    setIsGenerating(true);
    const result = await estimatePropertyPrice(
      formData.type,
      formData.area,
      formData.address,
      formData.bedrooms
    );
    setAiEstimation(result);
    setIsGenerating(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề tin đăng</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                placeholder="Ví dụ: Nhà phố 3 tầng mặt tiền Quận 1"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại bất động sản</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="house">Nhà phố</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="land">Đất nền</option>
                  <option value="villa">Biệt thự</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá (triệu VNĐ)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md" 
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-md" 
                value={formData.area === 0 ? '' : formData.area}
                onChange={(e) => setFormData({...formData, area: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pháp lý</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.legal}
                onChange={(e) => setFormData({...formData, legal: e.target.value})}
              >
                <option value="pink_book">Sổ hồng</option>
                <option value="red_book">Sổ đỏ</option>
                <option value="contract">Hợp đồng mua bán</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số phòng ngủ</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-md" 
                value={formData.bedrooms === 0 ? '' : formData.bedrooms}
                onChange={(e) => setFormData({...formData, bedrooms: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hướng</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                placeholder="Đông Nam, Tây Bắc..."
                value={formData.direction}
                onChange={(e) => setFormData({...formData, direction: e.target.value})}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                placeholder="Số nhà, tên đường, phường, quận..."
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            {/* Geocoding Button */}
            <Button 
              variant="outline" 
              onClick={handleGeocodeAddress}
              disabled={isGeocodingAddress}
              className="w-full"
            >
              {isGeocodingAddress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tìm tọa độ...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Tìm tọa độ từ địa chỉ
                </>
              )}
            </Button>

            {geoError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-700">{geoError}</p>
              </div>
            )}

            {/* Latitude / Longitude Inputs */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div>
                <label className="block text-sm font-medium mb-1">Vĩ độ (Latitude)</label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full p-2 border rounded-md text-sm" 
                  placeholder="10.776"
                  value={formData.location_lat === 0 ? '' : formData.location_lat}
                  onChange={(e) => setFormData({...formData, location_lat: parseFloat(e.target.value) || 0})}
                />
                <p className="text-xs text-gray-500 mt-1">Phạm vi: -90 đến 90</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kinh độ (Longitude)</label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="w-full p-2 border rounded-md text-sm" 
                  placeholder="106.701"
                  value={formData.location_lng === 0 ? '' : formData.location_lng}
                  onChange={(e) => setFormData({...formData, location_lng: parseFloat(e.target.value) || 0})}
                />
                <p className="text-xs text-gray-500 mt-1">Phạm vi: -180 đến 180</p>
              </div>
            </div>

            {/* Map Preview */}
            {(formData.location_lat !== 0 || formData.location_lng !== 0) ? (
              <div className="h-48 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
                <iframe
                  title="Bản đồ xem trước"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.location_lng - 0.01}%2C${formData.location_lat - 0.01}%2C${formData.location_lng + 0.01}%2C${formData.location_lat + 0.01}&layer=mapnik&marker=${formData.location_lat}%2C${formData.location_lng}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Bản đồ sẽ hiển thị khi bạn nhập tọa độ</p>
                  <p className="text-xs mt-1">(Kinh độ, Vĩ độ)</p>
                </div>
              </div>
            )}

            <div className="p-3 bg-orange-50 border border-orange-100 rounded-md text-xs text-orange-700">
              <p className="font-medium mb-1">💡 Mẹo:</p>
              <p>• Nhập địa chỉ rồi bấm "Tìm tọa độ" để tự động lấy tọa độ</p>
              <p>• Hoặc nhập vĩ độ/kinh độ thủ công nếu biết chính xác</p>
              <p className="mt-2">Ví dụ HCM: Vĩ độ 10.776, Kinh độ 106.701</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Link Video (Youtube)</label>
                <input 
                  type="url" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link Tour 3D / VR</label>
                <input 
                  type="url" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="https://my.matterport.com/show/?m=..."
                  value={formData.tour_3d_url}
                  onChange={(e) => setFormData({...formData, tour_3d_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link bản scan pháp lý</label>
                <input
                  type="url"
                  className="w-full p-2 border rounded-md"
                  placeholder="https://.../so-do-hoac-so-hong.pdf"
                  value={formData.legal_scan_url}
                  onChange={(e) => setFormData({...formData, legal_scan_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link quy hoạch khu vực</label>
                <input
                  type="url"
                  className="w-full p-2 border rounded-md"
                  placeholder="https://.../ban-do-quy-hoach"
                  value={formData.planning_url}
                  onChange={(e) => setFormData({...formData, planning_url: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group">
                  <img src={preview} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                <ImageIcon className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm font-semibold text-blue-600">Thêm ảnh</span>
              </label>
            </div>
            {imagePreviews.length === 0 && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-md">
                <p className="text-xs text-orange-700">Mẹo: Đăng ít nhất 5 ảnh rõ nét để tăng 80% tỷ lệ liên hệ. Nếu không có ảnh, hệ thống sẽ dùng ảnh mặc định.</p>
              </div>
            )}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-xs text-blue-700">Tất cả hình ảnh tải lên sẽ được gắn logo bản quyền tự động. Xin vui lòng sử dụng hình thật để người mua có cái nhìn khách quan.</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleAiDescription} disabled={isGenerating} className="flex-1">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />}
                Tạo mô tả bằng AI
              </Button>
              <Button variant="outline" onClick={handleAiValuation} disabled={isGenerating} className="flex-1">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                Định giá bằng AI
              </Button>
            </div>
            
            {formData.description && (
              <div className="p-4 bg-gray-50 rounded-md border text-sm">
                <h4 className="font-bold mb-2">Mô tả đề xuất:</h4>
                <p className="whitespace-pre-wrap">{formData.description}</p>
              </div>
            )}

            {aiEstimation && (
              <div className="p-4 bg-green-50 rounded-md border border-green-100 text-sm">
                <h4 className="font-bold text-green-800 mb-2">Kết quả định giá AI:</h4>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ~ {aiEstimation.estimatedPrice.toLocaleString()} triệu VNĐ
                </div>
                <p className="text-xs text-green-700 mb-2">Độ tin cậy: {(aiEstimation.confidence * 100).toFixed(0)}%</p>
                <p className="italic text-gray-600">"{aiEstimation.reasoning}"</p>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 text-center py-6">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-lg">Xác minh danh tính (KYC)</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Vui lòng chụp ảnh CCCD mặt trước và mặt sau để xác minh chính chủ. 
              Dữ liệu được mã hóa và bảo mật tuyệt đối.
            </p>
            <Button variant="primary">Bắt đầu xác minh</Button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-gray-50">
              <h4 className="font-bold mb-2">Xem lại thông tin:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-gray-500">Tiêu đề:</span> <span className="font-medium">{formData.title}</span>
                <span className="text-gray-500">Giá:</span> <span className="font-medium text-blue-600">{formData.price.toLocaleString()} triệu</span>
                <span className="text-gray-500">Diện tích:</span> <span className="font-medium">{formData.area} m²</span>
                <span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{formData.address}</span>
                {(formData.location_lat !== 0 || formData.location_lng !== 0) && (
                  <>
                    <span className="text-gray-500">Tọa độ:</span> <span className="font-medium text-green-600">{formData.location_lat.toFixed(6)}, {formData.location_lng.toFixed(6)}</span>
                  </>
                )}
              </div>
            </div>
            {(formData.location_lat !== 0 || formData.location_lng !== 0) && (
              <div className="h-40 rounded-md overflow-hidden border border-gray-300">
                <iframe
                  title="Bản đồ xác nhận vị trí"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.location_lng - 0.01}%2C${formData.location_lat - 0.01}%2C${formData.location_lng + 0.01}%2C${formData.location_lat + 0.01}&layer=mapnik&marker=${formData.location_lat}%2C${formData.location_lng}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
            <div className="flex items-center p-3 bg-orange-50 border border-orange-100 rounded-md text-xs text-orange-800">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              Tin đăng sẽ được duyệt tự động bằng AI và hiển thị trong vòng 4 giờ.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Đăng tin bất động sản</CardTitle>
          <div className="text-sm text-gray-500">Bước {currentStep} / {steps.length}</div>
        </div>
        <div className="flex justify-between mt-6 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={cn(
                "relative z-10 flex flex-col items-center gap-1",
                currentStep >= step.id ? "text-blue-600" : "text-gray-400"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                currentStep > step.id ? "bg-blue-600 border-blue-600 text-white" : 
                currentStep === step.id ? "bg-white border-blue-600 text-blue-600" : 
                "bg-white border-gray-200 text-gray-400"
              )}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.icon}
              </div>
              <span className="text-[10px] font-bold uppercase hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <div className="flex justify-between p-6 border-t bg-gray-50 rounded-b-xl">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <Button 
          variant="primary" 
          onClick={currentStep === steps.length ? handleSubmit : nextStep}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> {uploadProgress || 'Đang xử lý...'}</span>
          ) : currentStep === steps.length ? (
            'Gửi tin đăng'
          ) : (
            'Tiếp tục'
          )} 
          {currentStep !== steps.length && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </Card>
  );
}
