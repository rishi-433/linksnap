import { UrlItem, ShortenUrlRequest, ShortenUrlResponse, AnalyticsResponse, TimeframeOption } from '../types';
import { getStoredUrls, saveStoredUrls, generateMockAnalytics } from './mockData';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';

export function getShortUrl(shortCode: string): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/r/${shortCode}`;
  }
  return `http://localhost:3000/r/${shortCode}`;
}

class ApiService {
  private useMock: boolean = false;

  constructor() {
    const savedMode = localStorage.getItem('linksnap_mode');
    if (savedMode === 'mock') {
      this.useMock = true;
    }
  }

  public isMockMode(): boolean {
    return this.useMock;
  }

  public setMockMode(mock: boolean): void {
    this.useMock = mock;
    localStorage.setItem('linksnap_mode', mock ? 'mock' : 'live');
  }

  public getApiBase(): string {
    return API_BASE;
  }

  public async shortenUrl(payload: ShortenUrlRequest): Promise<ShortenUrlResponse> {
    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 400));
      const urls = getStoredUrls();

      let shortCode = payload.customSlug ? payload.customSlug.trim() : '';

      if (shortCode) {
        if (urls.some((u) => u.url_id === shortCode || u.custom_slug === shortCode)) {
          throw new Error('Custom slug is already in use.');
        }
      } else {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        shortCode = '';
        for (let i = 0; i < 6; i++) {
          shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }

      let title = payload.title || payload.originalUrl;
      try {
        const parsed = new URL(payload.originalUrl);
        title = parsed.hostname.replace('www.', '') + parsed.pathname;
      } catch {
        // fallback
      }

      const newUrlItem: UrlItem = {
        url_id: shortCode,
        original_url: payload.originalUrl,
        user_id: 'usr_demo123',
        created_at: new Date().toISOString(),
        expires_at: payload.expiresAt || null,
        total_clicks: 0,
        custom_slug: payload.customSlug || null,
        title: payload.title || title,
        status: 'active',
      };

      urls.unshift(newUrlItem);
      saveStoredUrls(urls);

      return {
        shortCode: newUrlItem.url_id,
        shortUrl: getShortUrl(newUrlItem.url_id),
        originalUrl: newUrlItem.original_url,
        createdAt: newUrlItem.created_at,
        expiresAt: newUrlItem.expires_at,
        totalClicks: 0,
      };
    }

    // Live MySQL Express API Call
    try {
      const res = await fetch(`${API_BASE}/api/v1/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('MySQL Backend unreachable, falling back to client mode:', err);
      this.useMock = true;
      return this.shortenUrl(payload);
    }
  }

  public async fetchUserUrls(): Promise<UrlItem[]> {
    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 200));
      return getStoredUrls();
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/urls`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return getStoredUrls();
    }
  }

  public async fetchAnalytics(shortCode: string, timeframe: TimeframeOption = '7d'): Promise<AnalyticsResponse> {
    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 350));
      return generateMockAnalytics(shortCode, timeframe);
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/${shortCode}?timeframe=${timeframe}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to load analytics (HTTP ${res.status})`);
      }
      return await res.json();
    } catch {
      return generateMockAnalytics(shortCode, timeframe);
    }
  }

  public async updateUrl(url_id: string, updates: Partial<UrlItem>): Promise<UrlItem> {
    const urls = getStoredUrls();
    const index = urls.findIndex((u) => u.url_id === url_id);
    if (index === -1) throw new Error('Link not found');

    const updated = { ...urls[index], ...updates };
    urls[index] = updated;
    saveStoredUrls(urls);
    return updated;
  }

  public async deleteUrl(url_id: string): Promise<void> {
    if (!this.useMock) {
      try {
        await fetch(`${API_BASE}/api/v1/urls/${url_id}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    }
    const urls = getStoredUrls();
    const filtered = urls.filter((u) => u.url_id !== url_id);
    saveStoredUrls(filtered);
  }

  public async recordClick(shortCode: string): Promise<string | null> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/redirect/${shortCode}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          return data.originalUrl || null;
        }
      } catch {
        // fallback
      }
    }

    const urls = getStoredUrls();
    const item = urls.find((u) => u.url_id === shortCode || u.custom_slug === shortCode);
    if (item && item.status === 'active') {
      item.total_clicks += 1;
      saveStoredUrls(urls);
      return item.original_url;
    }
    return null;
  }
}

export const apiService = new ApiService();


