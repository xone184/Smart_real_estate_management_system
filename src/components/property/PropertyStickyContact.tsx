import React from 'react';
import { Phone, MessageCircle, Mail, Heart, Share2 } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { motion } from 'motion/react';

interface PropertyStickyContactProps {
  price: string;
}

export function PropertyStickyContact({ price }: PropertyStickyContactProps) {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-2xl"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Giá bán</p>
          <p className="text-xl font-bold text-blue-600">{price}</p>
        </div>
        
        <div className="flex gap-2 flex-1">
          <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">
            <Phone className="w-4 h-4 mr-2" /> Gọi ngay
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-gray-100 text-blue-600">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-gray-100 text-gray-400">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
