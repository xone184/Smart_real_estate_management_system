import React from 'react';
import { motion } from 'motion/react';
import { Home, Target, Users, Award, TrendingUp, Shield, Sparkles, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '../shared/ui/Button';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

const teamMembers = [
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'CEO & Co-founder',
    avatar: 'https://picsum.photos/seed/ceo-team/200/200',
    desc: '10 năm kinh nghiệm trong lĩnh vực BĐS và công nghệ tài chính.',
  },
  {
    name: 'Trần Thị Lan',
    role: 'CTO & Co-founder',
    avatar: 'https://picsum.photos/seed/cto-team/200/200',
    desc: 'Chuyên gia AI/ML với 8 năm nghiên cứu ứng dụng trong định giá tài sản.',
  },
  {
    name: 'Lê Văn Bình',
    role: 'Head of Sales',
    avatar: 'https://picsum.photos/seed/sales-team/200/200',
    desc: 'Từng quản lý hơn 500 giao dịch BĐS thành công tại TP.HCM và Hà Nội.',
  },
  {
    name: 'Phạm Thu Hằng',
    role: 'Head of Technology',
    avatar: 'https://picsum.photos/seed/tech-team/200/200',
    desc: 'Kỹ sư phần mềm senior, chuyên xây dựng hệ thống quy mô lớn.',
  },
];

const timelineItems = [
  { year: '2022', title: 'Thành lập công ty', desc: 'SmartRE được thành lập với tầm nhìn ứng dụng AI vào lĩnh vực BĐS Việt Nam.' },
  { year: '2023', title: 'Ra mắt nền tảng Beta', desc: 'Hơn 500 người dùng đầu tiên, 50 công ty môi giới tham gia hệ thống.' },
  { year: '2024', title: 'Tích hợp AI định giá', desc: 'Mô hình ML chính xác 94%, xử lý hơn 10.000 yêu cầu định giá/tháng.' },
  { year: '2025', title: 'Mở rộng toàn quốc', desc: 'Hiện diện tại 20 tỉnh thành, hơn 50.000 người dùng và 2.000 đại lý.' },
  { year: '2026', title: 'SmartRE 3.0', desc: 'Tích hợp tour 3D, chatbot AI 24/7 và hệ thống KYC tự động hoàn toàn mới.' },
];

const stats = [
  { value: '50K+', label: 'Người dùng hoạt động', icon: <Users className="w-6 h-6" /> },
  { value: '2.000+', label: 'Đại lý chứng nhận', icon: <Award className="w-6 h-6" /> },
  { value: '15K+', label: 'Giao dịch thành công', icon: <TrendingUp className="w-6 h-6" /> },
  { value: '20', label: 'Tỉnh thành phủ sóng', icon: <MapPin className="w-6 h-6" /> },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-blue-200">Về SmartRE</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              Công nghệ AI <span className="text-blue-300">thay đổi</span> <br />
              thị trường bất động sản
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8">
              SmartRE là nền tảng quản lý bất động sản thông minh hàng đầu Việt Nam. 
              Chúng tôi ứng dụng trí tuệ nhân tạo để mang lại sự minh bạch, chính xác 
              và hiệu quả cho mọi giao dịch BĐS.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 h-12 rounded-2xl"
                onClick={() => onNavigate?.('home')}
              >
                Khám phá BĐS
              </Button>
              <Button
                variant="outline"
                className="border-blue-400 text-blue-200 hover:bg-blue-800/50 font-bold px-8 h-12 rounded-2xl"
                onClick={() => onNavigate?.('contact')}
              >
                Liên hệ chúng tôi
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Target className="w-7 h-7 text-blue-600" />,
              bg: 'bg-blue-50',
              title: 'Sứ mệnh',
              desc: 'Dân chủ hóa thị trường BĐS Việt Nam bằng công nghệ AI, tạo ra môi trường giao dịch minh bạch, công bằng và hiệu quả cho tất cả mọi người.'
            },
            {
              icon: <Sparkles className="w-7 h-7 text-purple-600" />,
              bg: 'bg-purple-50',
              title: 'Tầm nhìn',
              desc: 'Trở thành nền tảng BĐS số 1 Đông Nam Á vào năm 2030, với hơn 1 triệu người dùng và hệ sinh thái BĐS toàn diện nhất khu vực.'
            },
            {
              icon: <Shield className="w-7 h-7 text-green-600" />,
              bg: 'bg-green-50',
              title: 'Giá trị cốt lõi',
              desc: 'Minh bạch - Chính xác - Bảo mật. Mọi giao dịch đều được xác minh, mọi dữ liệu đều được bảo vệ theo tiêu chuẩn quốc tế.'
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-5`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hành trình phát triển</h2>
            <p className="text-gray-500">Từ ý tưởng đến nền tảng BĐS hàng đầu Việt Nam</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-100" />
            {timelineItems.map((item, idx) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 mb-8 relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg z-10">
                  {item.year}
                </div>
                <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Đội ngũ lãnh đạo</h2>
          <p className="text-gray-500">Những con người tạo nên SmartRE</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center group"
            >
              <div className="relative w-32 h-32 mx-auto mb-4">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full rounded-3xl object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-blue-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-blue-600 font-medium mb-2">{member.role}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{member.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng trải nghiệm SmartRE?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Tham gia cùng hàng nghìn nhà đầu tư thông minh đang sử dụng AI để tối ưu hóa 
              danh mục bất động sản của họ.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-12 rounded-2xl"
                onClick={() => onNavigate?.('home')}
              >
                Bắt đầu ngay miễn phí
              </Button>
              <Button
                variant="outline"
                className="border-white/60 text-white hover:bg-blue-700/50 font-bold px-10 h-12 rounded-2xl"
                onClick={() => onNavigate?.('contact')}
              >
                <Phone className="w-4 h-4 mr-2" /> Liên hệ tư vấn
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
