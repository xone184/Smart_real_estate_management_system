import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Layout, Maximize2, Download, Layers } from 'lucide-react';
import { Button } from '../shared/ui/Button';

export function PropertyFloorPlan() {
  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-600" />
          Mặt bằng & Thiết kế
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-gray-100">
            <Layers className="w-3 h-3 mr-1.5" /> Tầng 15
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-gray-100">
            <Maximize2 className="w-3 h-3 mr-1.5" /> Phóng to
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative aspect-square md:aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
          <img 
            src="https://picsum.photos/seed/floorplan/1200/800" 
            className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500" 
            alt="Floor Plan" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
          <div className="absolute bottom-4 right-4">
            <Button className="h-10 rounded-xl bg-white text-blue-600 hover:bg-gray-50 shadow-lg border border-gray-100 font-bold">
              <Download className="w-4 h-4 mr-2" /> Tải PDF Mặt Bằng
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phòng khách</p>
            <p className="text-sm font-bold text-gray-900">25.5 m²</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phòng ngủ 1</p>
            <p className="text-sm font-bold text-gray-900">18.2 m²</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phòng ngủ 2</p>
            <p className="text-sm font-bold text-gray-900">14.5 m²</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Ban công</p>
            <p className="text-sm font-bold text-gray-900">6.8 m²</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
