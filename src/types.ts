export type PropertyType = 'house' | 'apartment' | 'land' | 'villa';
export type LegalStatus = 'pink_book' | 'red_book' | 'contract' | 'other';
export type ListingStatus = 'pending' | 'active' | 'sold' | 'rejected';

export interface Property {
  id: number;
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  legal: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  images: string[];
  room_images: { room_type: string, url: string, description: string }[];
  video_url?: string;
  tour_3d_url?: string;
  legal_scan_url?: string;
  planning_url?: string;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  status: ListingStatus;
  reject_reason?: string | null;
  created_at: string;
  updated_at: string;
  ai_valuation?: number;
  tags: string[];
}

export interface UserProfile {
  id: number;
  email: string;
  display_name: string;
  photo_url: string;
  role: 'admin' | 'user' | 'agent';
  kyc_verified: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}
