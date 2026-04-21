import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Play, Info } from 'lucide-react';

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname.includes('youtube.com')) {
      const params = parsedUrl.searchParams;
      const videoId = params.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      const pathMatch = parsedUrl.pathname.match(/\/embed\/(.+)/);
      if (pathMatch) {
        return `https://www.youtube.com/embed/${pathMatch[1]}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

interface PropertyVideoProps {
  videoUrl?: string;
}

export function PropertyVideo({ videoUrl }: PropertyVideoProps) {
  const embedUrl = videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-600" />
          Video giới thiệu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {embedUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title="Video giới thiệu bất động sản"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 group cursor-pointer">
            <img
              src="https://picsum.photos/seed/property-video/1280/720"
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              alt="Video Thumbnail"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Play className="w-8 h-8 text-blue-600 fill-current ml-1" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-xl">
              <p className="text-white font-bold">Video 4K - Toàn cảnh căn hộ và tiện ích nội khu</p>
              <p className="text-gray-300 text-xs">03:45 • Quay bằng Drone & Camera 360</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            {embedUrl
              ? 'Video này cung cấp cái nhìn chân thực nhất về không gian sống, ánh sáng tự nhiên và chất lượng bàn giao thực tế của căn hộ.'
              : 'Thêm link YouTube vào tin đăng để người xem có thể xem video trực tiếp tại đây.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
