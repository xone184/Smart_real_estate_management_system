import React from 'react';
import { ChevronRight, Home, MapPin } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PropertyBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function PropertyBreadcrumb({ items }: PropertyBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-2" /> Trang chủ
      </button>
      
      <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
      
      <button className="flex items-center hover:text-blue-600 transition-colors">
        <MapPin className="w-3.5 h-3.5 mr-2" /> TP. Hồ Chí Minh
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <button 
            onClick={item.onClick}
            className={`flex items-center transition-colors ${index === items.length - 1 ? 'text-blue-600 cursor-default' : 'hover:text-blue-600'}`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
