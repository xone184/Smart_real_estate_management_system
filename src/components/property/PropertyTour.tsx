import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Play, Pause, SkipForward, SkipBack, Info, MapPin, ExternalLink } from 'lucide-react';
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
    title: 'Phòng khách sang trọng',
    description: 'Không gian mở với cửa kính sát trần, đón trọn ánh sáng tự nhiên và view sông Sài Gòn.',
    image: 'https://picsum.photos/seed/living/1200/800'
  },
  {
    id: 2,
    title: 'Bếp & Khu vực ăn uống',
    description: 'Thiết kế hiện đại với đảo bếp, trang bị đầy đủ thiết bị Bosch cao cấp.',
    image: 'https://picsum.photos/seed/kitchen/1200/800'
  },
  {
    id: 3,
    title: 'Phòng ngủ Master',
    description: 'Rộng rãi với hệ thống tủ âm tường, sàn gỗ tự nhiên và ban công riêng.',
    image: 'https://picsum.photos/seed/bedroom/1200/800'
  },
  {
    id: 4,
    title: 'Ban công view triệu đô',
    description: 'Góc thư giãn lý tưởng với tầm nhìn panorama toàn cảnh thành phố.',
    image: 'https://picsum.photos/seed/balcony/1200/800'
  }
];

interface PropertyTourProps {
  videoUrl?: string;
}

export function PropertyTour({ videoUrl }: PropertyTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoType = videoUrl ? getVideoType(videoUrl) : null;
  const embedUrl = videoUrl && getVideoEmbedUrl(videoUrl);
  const isYoutube = videoType === 'youtube';
  const isMp4 = videoType === 'mp4';
  const videoAvailable = !!videoType && !!videoUrl;
  const youtubeEmbedUrl = isYoutube && embedUrl ? `${embedUrl}?rel=0&modestbranding=1&playsinline=1` : embedUrl;

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % tourSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + tourSteps.length) % tourSteps.length);
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
        {videoType === 'youtube' && youtubeEmbedUrl ? (
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
        ) : videoType === 'mp4' && videoUrl ? (
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
            src={tourSteps[currentStep].image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
            alt={tourSteps[currentStep].title}
            referrerPolicy="no-referrer"
          />
        )}
      </AnimatePresence>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
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
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2 uppercase tracking-widest">
              <MapPin className="w-4 h-4" />
              Điểm dừng {currentStep + 1}/{tourSteps.length}
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">{tourSteps[currentStep].title}</h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">{tourSteps[currentStep].description}</p>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
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
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextStep}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>

              <div className="hidden sm:flex gap-2">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-500',
                      currentStep === idx ? 'w-12 bg-blue-500' : 'w-4 bg-white/30 hover:bg-white/50'
                    )}
                  />
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
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI Tour Guide</p>
            <p className="text-xs text-white font-medium">Đang thuyết minh tự động</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
