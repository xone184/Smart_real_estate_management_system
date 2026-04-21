import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Share2, Facebook, Twitter, Link as LinkIcon, Mail, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '../shared/ui/Button';

interface PropertyShareProps {
  url: string;
  title: string;
}

export function PropertyShare({ url, title }: PropertyShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          Chia sẻ tin đăng
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button 
            className="flex flex-col items-center justify-center gap-2 group"
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')}
          >
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
              <Facebook className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Facebook</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center gap-2 group"
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')}
          >
            <div className="p-3 bg-sky-400 rounded-2xl text-white shadow-lg shadow-sky-100 group-hover:scale-110 transition-transform">
              <Twitter className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Twitter</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center gap-2 group"
            onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
          >
            <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-100 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Email</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 group" onClick={handleCopy}>
            <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-lg shadow-gray-100 group-hover:scale-110 transition-transform">
              {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <LinkIcon className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        <div className="relative p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Đường dẫn trực tiếp</p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-600 truncate flex-1 font-mono">{url}</p>
            <button 
              onClick={handleCopy}
              className="p-2 bg-white rounded-lg border border-gray-100 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          {copied && (
            <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-sm animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Đã sao chép liên kết!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
