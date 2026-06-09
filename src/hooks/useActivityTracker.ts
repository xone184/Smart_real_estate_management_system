import { useEffect, useRef } from 'react';

type ActivityType = 'view_news' | 'view_property' | 'search' | 'click_news' | 'like_news';

export const useActivityTracker = () => {
  const sessionStartTime = useRef<number>(Date.now());
  
  const trackActivity = async (activityType: ActivityType, targetId?: string, metadata?: any) => {
    try {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      await fetch('/smart-real-estate-management-system/api/analytics/track.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: activityType,
          target_id: targetId,
          duration_seconds: durationSeconds,
          metadata: metadata
        })
      });
      
      // Reset timer after tracking to avoid duplicate large durations
      sessionStartTime.current = Date.now();
    } catch (error) {
      console.error('Tracking failed', error);
    }
  };

  return { trackActivity };
};
