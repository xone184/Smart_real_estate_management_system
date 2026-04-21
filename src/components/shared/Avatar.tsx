import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  alt?: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  fallbackIcon?: React.ReactNode;
}

export function Avatar({
  src,
  name,
  alt,
  size = 10,
  className,
  rounded = true,
  fallbackIcon,
}: AvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [triedAlternate, setTriedAlternate] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedAlternate(false);
  }, [src]);

  const alternateSrc = useMemo(() => {
    if (!src) return undefined;
    if (src.startsWith('/smart-real-estate-management-system/uploads/')) {
      return src.replace(
        '/smart-real-estate-management-system/uploads/',
        '/smart-real-estate-management-system/api/uploads/'
      );
    }
    if (src.startsWith('/smart-real-estate-management-system/api/uploads/')) {
      return src.replace(
        '/smart-real-estate-management-system/api/uploads/',
        '/smart-real-estate-management-system/uploads/'
      );
    }
    return undefined;
  }, [src]);

  const handleError = () => {
    if (!triedAlternate && alternateSrc) {
      setCurrentSrc(alternateSrc);
      setTriedAlternate(true);
    } else {
      setCurrentSrc(undefined);
    }
  };

  const initials = name?.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={cn(
        rounded ? 'rounded-full' : 'rounded-xl',
        'overflow-hidden bg-blue-100 text-blue-600 font-bold flex items-center justify-center',
        className
      )}
      style={{ width: size * 4, height: size * 4, minWidth: size * 4, minHeight: size * 4 }}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt ?? `Avatar of ${name || 'user'}`}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : fallbackIcon ? (
        <>{fallbackIcon}</>
      ) : (
        <span style={{ fontSize: size * 1.4 }}>{initials}</span>
      )}
    </div>
  );
}
