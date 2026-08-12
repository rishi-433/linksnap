import { UrlItem, AnalyticsResponse, TimeframeOption, GeoPoint } from '../types';

const INITIAL_URLS: UrlItem[] = [
  {
    url_id: 'tech-launch-2026',
    original_url: 'https://github.com/aws/aws-sam-cli/releases/tag/v1.120.0',
    user_id: 'usr_demo123',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    total_clicks: 1482,
    custom_slug: 'tech-launch-2026',
    title: 'AWS SAM CLI v1.120 Release Notes & Benchmarks',
    status: 'active',
  },
  {
    url_id: 'react-19-guide',
    original_url: 'https://react.dev/blog/2024/12/05/react-19',
    user_id: 'usr_demo123',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
    total_clicks: 893,
    custom_slug: 'react-19-guide',
    title: 'React 19 Server Components Deep Dive',
    status: 'active',
  },
  {
    url_id: 'xK9aL1',
    original_url: 'https://aws.amazon.com/dynamodb/pricing/',
    user_id: 'usr_demo123',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    total_clicks: 412,
    custom_slug: null,
    title: 'Amazon DynamoDB On-Demand Pricing Calculator',
    status: 'active',
  },
  {
    url_id: 'spring-promo',
    original_url: 'https://stripe.com/docs/api',
    user_id: 'usr_demo123',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_clicks: 650,
    custom_slug: 'spring-promo',
    title: 'Stripe API Reference v2026-03',
    status: 'expired',
  },
];

const STORAGE_KEY = 'linksnap_mock_urls_v1';

export function getStoredUrls(): UrlItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_URLS));
    return INITIAL_URLS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_URLS;
  }
}

export function saveStoredUrls(urls: UrlItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

// Generate realistic analytics data for mock mode
export function generateMockAnalytics(shortCode: string, timeframe: TimeframeOption): AnalyticsResponse {
  const urls = getStoredUrls();
  const urlItem = urls.find((u) => u.url_id === shortCode || u.custom_slug === shortCode) || urls[0];

  const now = new Date();
  let pointsCount = 7;
  let labelFormatter = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  let stepMs = 24 * 60 * 60 * 1000;

  if (timeframe === '24h') {
    pointsCount = 24;
    stepMs = 60 * 60 * 1000;
    labelFormatter = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (timeframe === '30d') {
    pointsCount = 30;
    stepMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === 'all') {
    pointsCount = 14;
    stepMs = 2 * 24 * 60 * 60 * 1000;
  }

  const timeSeriesData = [];
  const baseClicks = Math.floor(urlItem.total_clicks / pointsCount);

  for (let i = pointsCount - 1; i >= 0; i--) {
    const ptDate = new Date(now.getTime() - i * stepMs);
    const variance = Math.floor((Math.sin(i) + 1.2) * (baseClicks * 0.4));
    const clicks = Math.max(2, baseClicks + variance);
    const uniqueVisitors = Math.floor(clicks * 0.72);

    timeSeriesData.push({
      timestamp: ptDate.toISOString(),
      label: labelFormatter(ptDate),
      clicks,
      uniqueVisitors,
    });
  }

  const geoDistribution: GeoPoint[] = [
    {
      country: 'US',
      countryName: 'United States',
      clicks: Math.floor(urlItem.total_clicks * 0.42),
      percentage: 42,
      latitude: 37.0902,
      longitude: -95.7129,
      cities: [
        { name: 'San Francisco', clicks: 180 },
        { name: 'New York', clicks: 150 },
        { name: 'Austin', clicks: 90 },
      ],
    },
    {
      country: 'GB',
      countryName: 'United Kingdom',
      clicks: Math.floor(urlItem.total_clicks * 0.22),
      percentage: 22,
      latitude: 55.3781,
      longitude: -3.436,
      cities: [
        { name: 'London', clicks: 120 },
        { name: 'Manchester', clicks: 45 },
      ],
    },
    {
      country: 'DE',
      countryName: 'Germany',
      clicks: Math.floor(urlItem.total_clicks * 0.15),
      percentage: 15,
      latitude: 51.1657,
      longitude: 10.4515,
      cities: [
        { name: 'Berlin', clicks: 85 },
        { name: 'Munich', clicks: 40 },
      ],
    },
    {
      country: 'IN',
      countryName: 'India',
      clicks: Math.floor(urlItem.total_clicks * 0.12),
      percentage: 12,
      latitude: 20.5937,
      longitude: 78.9629,
      cities: [
        { name: 'Bengaluru', clicks: 95 },
        { name: 'Mumbai', clicks: 50 },
      ],
    },
    {
      country: 'JP',
      countryName: 'Japan',
      clicks: Math.floor(urlItem.total_clicks * 0.09),
      percentage: 9,
      latitude: 36.2048,
      longitude: 138.2529,
      cities: [{ name: 'Tokyo', clicks: 65 }],
    },
  ];

  return {
    shortCode: urlItem.url_id,
    originalUrl: urlItem.original_url,
    totalClicks: urlItem.total_clicks,
    timeframe,
    timeSeriesData,
    geoDistribution,
    deviceBreakdown: [
      { device: 'Desktop', clicks: Math.floor(urlItem.total_clicks * 0.58), percentage: 58, color: '#6366f1' },
      { device: 'Mobile', clicks: Math.floor(urlItem.total_clicks * 0.34), percentage: 34, color: '#22d3ee' },
      { device: 'Tablet', clicks: Math.floor(urlItem.total_clicks * 0.08), percentage: 8, color: '#a855f7' },
    ],
    topReferrers: [
      { referer: 'Direct / None', clicks: Math.floor(urlItem.total_clicks * 0.38), percentage: 38 },
      { referer: 'Twitter / X', clicks: Math.floor(urlItem.total_clicks * 0.28), percentage: 28 },
      { referer: 'Google Search', clicks: Math.floor(urlItem.total_clicks * 0.18), percentage: 18 },
      { referer: 'LinkedIn', clicks: Math.floor(urlItem.total_clicks * 0.11), percentage: 11 },
      { referer: 'GitHub', clicks: Math.floor(urlItem.total_clicks * 0.05), percentage: 5 },
    ],
    browserBreakdown: [
      { browser: 'Chrome', clicks: Math.floor(urlItem.total_clicks * 0.62), percentage: 62 },
      { browser: 'Safari', clicks: Math.floor(urlItem.total_clicks * 0.22), percentage: 22 },
      { browser: 'Firefox', clicks: Math.floor(urlItem.total_clicks * 0.10), percentage: 10 },
      { browser: 'Edge', clicks: Math.floor(urlItem.total_clicks * 0.06), percentage: 6 },
    ],
  };
}
