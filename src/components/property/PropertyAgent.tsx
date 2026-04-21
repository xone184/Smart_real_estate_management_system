import React from 'react';
import { Card, CardContent } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Star, ShieldCheck, MessageCircle, Phone, Mail, Award, MapPin } from 'lucide-react';
import { Property } from '@/src/types';

interface PropertyAgentProps {
  ownerId?: number;
  propertyId?: number;
  property?: Property;
}

export function PropertyAgent({ ownerId, propertyId, property }: PropertyAgentProps) {
  const name = property?.owner_name || 'Người Dùng Ẩn Danh';
  const email = property?.owner_email || 'support@smartre.vn';
  const role = 'Chuyên viên tư vấn';
  const phone = '0901234567'; // Default mocup phone

  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
      <CardContent className="p-6 -mt-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white flex items-center justify-center font-bold text-3xl text-blue-500">
              {name.charAt(0).toUpperCase()}
            </div>
            {property?.owner_id === 1 && (
              <div className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full border-2 border-white shadow-sm">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-900">{name}</h4>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">{role}</p>
          </div>

          <div className="flex items-center justify-center gap-4 py-2 px-6 bg-gray-50 rounded-2xl w-full">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">4.9</p>
              <div className="flex text-yellow-400">
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{email}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Thông tin xác thực</p>
            </div>
          </div>

          <div className="w-full space-y-3 pt-4">
            <a href={`tel:${phone}`} className="block">
              <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">
                <Phone className="w-4 h-4 mr-2" /> Gọi điện: {phone}
              </Button>
            </a>
            <div className="grid grid-cols-2 gap-3">
              <a href={`https://zalo.me/${phone}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-gray-100 hover:border-blue-200">
                  <MessageCircle className="w-4 h-4 mr-2 text-blue-600" /> Zalo
                </Button>
              </a>
              <a href={`mailto:${email}`}>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-gray-100 hover:border-blue-200">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" /> Email
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 pt-6 border-t border-gray-50">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Award className="w-4 h-4 text-blue-500" />
            <span>Top 10 môi giới xuất sắc 2025</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Khu vực: Quận 1, Quận 2, Bình Thạnh</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
