import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface PropertyNotificationProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function PropertyNotification({ notifications, onClose }: PropertyNotificationProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'error': return 'bg-red-50 border-red-100';
      case 'warning': return 'bg-yellow-50 border-yellow-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${getBgColor(notification.type)}`}
          >
            <div className="shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 leading-tight">{notification.message}</p>
            </div>
            <button 
              onClick={() => onClose(notification.id)}
              className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
