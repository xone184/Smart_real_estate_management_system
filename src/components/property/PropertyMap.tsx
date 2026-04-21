import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface PropertyMapProps {
  location: { lat: number; lng: number };
  address: string;
}

export function PropertyMap({ location, address }: PropertyMapProps) {
  const [resolved, setResolved] = React.useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const normalizedAddress = (address || '').toLowerCase();

  const hasRawValidCoords =
    Number.isFinite(location?.lat) &&
    Number.isFinite(location?.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180 &&
    !(location.lat === 0 && location.lng === 0);

  // Heuristic: địa chỉ Hà Nội nhưng tọa độ ở miền Nam (HCM) => coi là sai tọa độ
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
      ? location.lat >= 19.5 // Hà Nội ~ 21.x
      : addressLooksHcm
      ? location.lat <= 12.5 // TP.HCM ~ 10.x
      : true;

  const hasValidCoords = hasRawValidCoords && coordsMatchAddressRegion;

  React.useEffect(() => {
    let ignore = false;

    if (hasValidCoords) {
      setResolved({ lat: location.lat, lng: location.lng });
      return;
    }

    if (!address?.trim()) {
      setResolved({ lat: 10.776, lng: 106.701 });
      return;
    }

    const geocode = async () => {
      setLoading(true);
      try {
        // Nominatim: fallback geocoding từ địa chỉ nếu dữ liệu lat/lng chưa đúng
        const q = encodeURIComponent(`${address}, Việt Nam`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
        const data = await res.json();
        if (!ignore && Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
          setResolved({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        } else if (!ignore) {
          setResolved({ lat: 10.776, lng: 106.701 });
        }
      } catch {
        if (!ignore) setResolved({ lat: 10.776, lng: 106.701 });
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    geocode();
    return () => {
      ignore = true;
    };
  }, [address, hasValidCoords, location?.lat, location?.lng]);

  const center = resolved ?? { lat: 10.776, lng: 106.701 };
  const delta = 0.008;
  const left = center.lng - delta;
  const right = center.lng + delta;
  const top = center.lat + delta;
  const bottom = center.lat - delta;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
  const osmOpenUrl = `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=16/${center.lat}/${center.lng}`;

  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200">
      <iframe
        title="Bản đồ vị trí bất động sản"
        src={osmEmbedUrl}
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20 text-xs font-medium text-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-gray-900">Vị trí bất động sản</span>
          </div>
          <div className="truncate max-w-[280px] text-gray-600">{address}</div>
          <div className="mt-1 text-gray-500">
            Tọa độ: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
            {!hasValidCoords && <span className="ml-1">(ước lượng theo địa chỉ)</span>}
          </div>
          {loading && <div className="mt-1 text-blue-600">Đang xác định vị trí từ địa chỉ...</div>}
        </div>

        <a
          href={osmOpenUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-white/20 text-xs font-semibold text-blue-700 hover:bg-white flex items-center gap-1"
        >
          Mở bản đồ
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="absolute bottom-4 left-4">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-gray-600 shadow border border-white/20">
          Nguồn bản đồ: OpenStreetMap
        </div>
      </div>
    </div>
  );
}
