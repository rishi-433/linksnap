export interface UrlRecord {
  url_id: string;
  original_url: string;
  user_id: string;
  created_at: string;
  expires_at?: string | null;
  total_clicks: number;
  custom_slug?: string | null;
  title?: string;
  status: 'active' | 'expired' | 'disabled';
}

export interface ClickRecord {
  click_id: string;
  timestamp: string;
  url_id: string;
  ip_address: string;
  country: string;
  country_name: string;
  city: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  referer: string;
}

export interface ShortenPayload {
  originalUrl: string;
  customSlug?: string;
  expiresAt?: string;
  title?: string;
}
