import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyGalleryProps {
  images: string[];
}

const fallbackGalleryImage = 'https://picsum.photos/seed/realestate-gallery/1200/800';

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const sourceImages = images.length > 0 ? images : [fallbackGalleryImage];

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % sourceImages.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + sourceImages.length) % sourceImages.length);

  return (
    <div className="relative aspect-video group">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={sourceImages[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setShowFullscreen(true)}
          alt={`Property ${currentIndex + 1}`}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackGalleryImage; }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setShowFullscreen(true)}
          className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/30 hover:bg-white/30 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={prevImage}
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/40 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={nextImage}
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/40 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="flex gap-2 p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={sourceImages[i]} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackGalleryImage; }} />
            </button>
          ))}
        </div>
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
          {currentIndex + 1} / {images.length} Hình ảnh
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Chế độ xem toàn màn hình</span>
              </div>
              <button 
                onClick={() => setShowFullscreen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center p-8">
              <motion.img 
                key={currentIndex}
                src={sourceImages[currentIndex]}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                alt="Fullscreen"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackGalleryImage; }}
              />
              
              <button onClick={prevImage} className="absolute left-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button onClick={nextImage} className="absolute right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors">
                <ChevronRight className="w-10 h-10" />
              </button>
            </div>

            <div className="p-8 flex justify-center gap-4 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === currentIndex ? 'border-blue-500 scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackGalleryImage; }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
