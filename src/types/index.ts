export interface UrlItem {
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

export interface ClickItem {
  click_id: string;
  timestamp: string;
  url_id: string;
  ip_address: string;
  country: string;
  country_name: string;
  city: string;
  latitude?: number;
  longitude?: number;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  referer: string;
}

export interface ShortenUrlRequest {
  originalUrl: string;
  customSlug?: string;
  expiresAt?: string;
  title?: string;
}

export interface ShortenUrlResponse {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string | null;
  totalClicks: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  label: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface GeoPoint {
  country: string;
  countryName: string;
  clicks: number;
  percentage: number;
  latitude: number;
  longitude: number;
  cities: Array<{ name: string; clicks: number }>;
}

export interface DevicePoint {
  device: string;
  clicks: number;
  percentage: number;
  color: string;
}

export interface ReferrerPoint {
  referer: string;
  clicks: number;
  percentage: number;
}

export interface BrowserPoint {
  browser: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsResponse {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  timeframe: '24h' | '7d' | '30d' | 'all';
  timeSeriesData: TimeSeriesPoint[];
  geoDistribution: GeoPoint[];
  deviceBreakdown: DevicePoint[];
  topReferrers: ReferrerPoint[];
  browserBreakdown: BrowserPoint[];
}

export type TimeframeOption = '24h' | '7d' | '30d' | 'all';
