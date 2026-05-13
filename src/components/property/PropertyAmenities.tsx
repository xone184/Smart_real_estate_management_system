import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { 
  Waves, 
  Trees, 
  Dumbbell, 
  ShoppingBag, 
  Coffee, 
  Bus, 
  ShieldCheck, 
  Car, 
  Wifi, 
  Utensils,
  MapPin,
  ChevronRight
} from 'lucide-react';

const amenities = [
  { icon: <Waves className="w-5 h-5" />, label: "Hồ bơi vô cực", category: "Nội khu" },
  { icon: <Trees className="w-5 h-5" />, label: "Công viên 2ha", category: "Nội khu" },
  { icon: <Dumbbell className="w-5 h-5" />, label: "Phòng Gym & Yoga", category: "Nội khu" },
  { icon: <ShoppingBag className="w-5 h-5" />, label: "TTTM Vincom", category: "Ngoại khu" },
  { icon: <Coffee className="w-5 h-5" />, label: "Khu Cafe & BBQ", category: "Nội khu" },
  { icon: <Bus className="w-5 h-5" />, label: "Trạm Metro số 1", category: "Ngoại khu" },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "An ninh 24/7", category: "Nội khu" },
  { icon: <Car className="w-5 h-5" />, label: "Bãi đỗ xe thông minh", category: "Nội khu" },
  { icon: <Wifi className="w-5 h-5" />, label: "Sảnh chờ Wi-Fi", category: "Nội khu" },
  { icon: <Utensils className="w-5 h-5" />, label: "Khu ẩm thực", category: "Ngoại khu" },
];

/**
 * Replicate the same coordinate-validation logic used in PropertyMap
 * so the Google Maps link always matches the pin shown on the system map.
 */
function useResolvedLocation(location?: { lat: number; lng: number }, address?: string) {
  const [resolved, setResolved] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    let ignore = false;
    const normalizedAddress = (address || '').toLowerCase();

    const hasRawValidCoords =
      location != null &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng) &&
      Math.abs(location.lat) <= 90 &&
      Math.abs(location.lng) <= 180 &&
      !(location.lat === 0 && location.lng === 0);

    const addressLooksHanoi =
      normalizedAddress.includes('hà nội') ||
      normalizedAddress.includes('ha noi') ||
      normalizedAddress.includes('hn');
    const addressLooksHcm =
      normalizedAddress.includes('hồ chí minh') ||
      normalizedAddress.includes('ho chi minh') ||
      normalizedAddress.includes('tp.hcm') ||
      normalizedAddress.includes('tp hcm') ||
      normalizedAddress.includes('sài gòn') ||
      normalizedAddress.includes('sai gon');

    const coordsMatchAddressRegion =
      !hasRawValidCoords
        ? false
        : addressLooksHanoi
        ? location!.lat >= 19.5
        : addressLooksHcm
        ? location!.lat <= 12.5
        : true;

    const hasValidCoords = hasRawValidCoords && coordsMatchAddressRegion;

    if (hasValidCoords) {
      setResolved({ lat: location!.lat, lng: location!.lng });
      return;
    }

    if (!address?.trim()) {
      setResolved(null);
      return;
    }

    // Geocode from address (same as PropertyMap)
    const geocode = async () => {
      try {
        const q = encodeURIComponent(`${address}, Việt Nam`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
        const data = await res.json();
        if (!ignore && Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
          setResolved({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        }
      } catch {
        // silently fail
      }
    };
    geocode();

    return () => { ignore = true; };
  }, [location?.lat, location?.lng, address]);

  return resolved;
}

export function PropertyAmenities({ location, address }: { location?: { lat: number; lng: number }, address?: string }) {
  const resolvedLocation = useResolvedLocation(location, address);

  const handleOpenMap = () => {
    if (resolvedLocation) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${resolvedLocation.lat},${resolvedLocation.lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps`, '_blank');
    }
  };

  return (
    <Card className="border-gray-50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Tiện ích & Môi trường xung quanh
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {amenities.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all group cursor-default"
            >
              <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform mb-3">
                {item.icon}
              </div>
              <p className="text-xs font-bold text-gray-900 text-center mb-1">{item.label}</p>
              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{item.category}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white relative overflow-hidden shadow-xl shadow-blue-100">
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-2">Khám phá khu vực xung quanh</h4>
            <p className="text-sm text-blue-100 mb-4 max-w-md leading-relaxed">
              Vị trí đắc địa giúp bạn dễ dàng kết nối với các bệnh viện, trường học quốc tế và trung tâm tài chính chỉ trong 10 phút di chuyển.
            </p>
            <button 
              onClick={handleOpenMap}
              className="flex items-center gap-2 text-sm font-bold bg-white text-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Xem bản đồ chi tiết <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
}
