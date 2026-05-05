import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Play, Pause, SkipForward, SkipBack, Info, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const videoId = parsed.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const embedMatch = parsed.pathname.match(/\/embed\/(.+)/);
      if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

function getVideoType(url: string): 'youtube' | 'mp4' | null {
  const embedUrl = getVideoEmbedUrl(url);
  if (embedUrl) return 'youtube';
  if (url.trim().match(/\.(mp4|webm|ogg)(\?|$)/i)) return 'mp4';
  return null;
}

const tourSteps = [
  {
    id: 1,
    room_type: 'living_room',
    title: 'Phòng khách sang trọng',
    description: 'Không gian mở với cửa kính sát trần, đón trọn ánh sáng tự nhiên và view sông Sài Gòn.',
    url: 'https://picsum.photos/seed/living/1200/800'
  },
  {
    id: 2,
    room_type: 'kitchen',
    title: 'Bếp & Khu vực ăn uống',
    description: 'Thiết kế hiện đại với đảo bếp, trang bị đầy đủ thiết bị Bosch cao cấp.',
    url: 'https://picsum.photos/seed/kitchen/1200/800'
  },
  {
    id: 3,
    room_type: 'bedroom',
    title: 'Phòng ngủ Master',
    description: 'Rộng rãi với hệ thống tủ âm tường, sàn gỗ tự nhiên và ban công riêng.',
    url: 'https://picsum.photos/seed/bedroom/1200/800'
  },
  {
    id: 4,
    room_type: 'balcony',
    title: 'Ban công view triệu đô',
    description: 'Góc thư giãn lý tưởng với tầm nhìn panorama toàn cảnh thành phố.',
    url: 'https://picsum.photos/seed/balcony/1200/800'
  }
];

interface PropertyTourProps {
  videoUrl?: string;
  roomImages?: { room_type: string, url: string, description: string }[];
}

const getRoomLabel = (type: string) => {
  const labels: Record<string, string> = {
    living_room: 'Phòng khách',
    bedroom: 'Phòng ngủ',
    kitchen: 'Phòng bếp',
    bathroom: 'Phòng tắm',
    facade: 'Mặt tiền',
    balcony: 'Ban công'
  };
  return labels[type] || 'Phòng';
};

export function PropertyTour({ videoUrl, roomImages = [] }: PropertyTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const hasRoomImages = roomImages && roomImages.length > 0;
  const activeSteps = hasRoomImages ? roomImages : tourSteps;

  const videoType = videoUrl ? getVideoType(videoUrl) : null;
  const embedUrl = videoUrl && getVideoEmbedUrl(videoUrl);
  const isYoutube = videoType === 'youtube';
  const isMp4 = videoType === 'mp4';
  const videoAvailable = !!videoType && !!videoUrl && !hasRoomImages;
  const youtubeEmbedUrl = isYoutube && embedUrl ? `${embedUrl}?rel=0&modestbranding=1&playsinline=1` : embedUrl;

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % activeSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + activeSteps.length) % activeSteps.length);
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  return (
    <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-gray-900 group">
      <AnimatePresence mode="wait">
        {videoAvailable && isYoutube && youtubeEmbedUrl ? (
          <motion.iframe
            key={youtubeEmbedUrl}
            src={youtubeEmbedUrl}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
            title="Guided Tour Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoAvailable && isMp4 && videoUrl ? (
          <motion.video
            key={videoUrl}
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay={false}
            muted
            className="w-full h-full object-cover"
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
          />
        ) : (
          <motion.img
            key={currentStep}
            src={activeSteps[currentStep].url}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
            alt={activeSteps[currentStep].room_type}
            referrerPolicy="no-referrer"
          />
        )}
      </AnimatePresence>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
        {videoAvailable ? (
          <motion.div
            key="video-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2 uppercase tracking-widest">
              <MapPin className="w-4 h-4" />
              Guided Tour Video
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {isYoutube ? 'Tour video thực tế trên YouTube' : 'Tour video thực tế'}
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {isYoutube
                ? 'Xem video tour trực tiếp trong trang hoặc mở trên YouTube để có trải nghiệm trọn vẹn.'
                : 'Phát video tour thực tế của bất động sản ngay tại đây.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] sm:text-xs mb-2 uppercase tracking-widest bg-blue-600/20 w-fit px-3 py-1 rounded-full border border-blue-400/30 backdrop-blur-sm">
              <MapPin className="w-3 h-3" />
              {getRoomLabel(activeSteps[currentStep].room_type)}
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {(activeSteps[currentStep] as any).title || getRoomLabel(activeSteps[currentStep].room_type)}
            </h3>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 italic line-clamp-2 sm:line-clamp-none">
              " {activeSteps[currentStep].description} "
            </p>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {videoAvailable ? (
            isMp4 ? (
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTogglePlay}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở video
                </a>
              </div>
            ) : (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Xem trên YouTube
              </a>
            )
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevStep}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
                >
                  {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextStep}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {activeSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-md',
                      currentStep === idx 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {getRoomLabel(step.room_type)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Assistant Badge */}
      <div className="absolute top-8 left-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI Guided Tour</p>
            <p className="text-xs text-white font-medium">Thuyết minh tự động bằng AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
