import React, { useState, useEffect } from 'react';
import { UrlItem, ShortenUrlRequest, ShortenUrlResponse } from './types';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar';
import { UrlShortenerForm } from './components/UrlShortenerForm';
import { LinkTable } from './components/LinkTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QrCodeModal } from './components/QrCodeModal';
import { EditSlugModal } from './components/EditSlugModal';
import { ShieldCheck, Cloud, Server, Database, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(apiService.isMockMode());
  const [selectedAnalyticsShortCode, setSelectedAnalyticsShortCode] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [editUrlItem, setEditUrlItem] = useState<UrlItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadUrls = async () => {
    try {
      const list = await apiService.fetchUserUrls();
      setUrls(list);
    } catch (err) {
      console.error('Error fetching URLs:', err);
    }
  };

  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    loadUrls();

    // Check if path, query, or hash contains a shortcode redirect request
    const rawPath = window.location.pathname;
    const cleanPath = rawPath.replace(/^\/r\//, '/').replace(/^\//, '').replace(/\/$/, '');
    const queryParams = new URLSearchParams(window.location.search);
    const codeFromQuery = queryParams.get('r') || queryParams.get('code');
    const hash = window.location.hash.replace(/^#\/?(r\/)?/, '');

    const shortCode =
      codeFromQuery ||
      (cleanPath && !cleanPath.includes('/') && cleanPath !== 'index.html' ? cleanPath : null) ||
      (hash && !hash.includes('/') ? hash : null);

    if (shortCode) {
      setRedirecting(shortCode);
      apiService.recordClick(shortCode).then((dest) => {
        if (dest) {
          window.location.href = dest;
        } else {
          setRedirecting(null);
          showToast(`Link "${shortCode}" not found or expired`, 'error');
        }
      });
    }
  }, [isMockMode]);


  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleMode = (mock: boolean) => {
    apiService.setMockMode(mock);
    setIsMockMode(mock);
    showToast(`Switched to ${mock ? 'Interactive Demo Mode' : 'Live AWS API Mode'}`, 'success');
  };

  const handleShorten = async (payload: ShortenUrlRequest): Promise<ShortenUrlResponse> => {
    const res = await apiService.shortenUrl(payload);
    await loadUrls();
    showToast(`Link shortened: ${res.shortCode}`, 'success');
    return res;
  };

  const handleDeleteLink = async (url_id: string) => {
    if (confirm(`Are you sure you want to delete short link "${url_id}"?`)) {
      await apiService.deleteUrl(url_id);
      await loadUrls();
      if (selectedAnalyticsShortCode === url_id) {
        setSelectedAnalyticsShortCode(null);
      }
      showToast(`Short link "${url_id}" deleted`, 'success');
    }
  };

  const handleSaveEdit = async (url_id: string, updates: Partial<UrlItem>) => {
    await apiService.updateUrl(url_id, updates);
    await loadUrls();
    showToast('Link details updated successfully', 'success');
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-indigo-500/30 space-y-4 shadow-2xl">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Redirecting...</h2>
          <p className="text-xs text-slate-400">
            Resolving short code <code className="text-cyan-300 font-bold">{redirecting}</code> and recording telemetry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-indigo-500 selection:text-white">

      
      {/* Navigation Header */}
      <Navbar
        isMockMode={isMockMode}
        onToggleMode={handleToggleMode}
        totalLinksCount={urls.length}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/90 border-rose-500/40 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {selectedAnalyticsShortCode ? (
          <AnalyticsDashboard
            shortCode={selectedAnalyticsShortCode}
            onBack={() => setSelectedAnalyticsShortCode(null)}
          />
        ) : (
          <>
            {/* Landing Hero & Shortener Card */}
            <UrlShortenerForm
              onShorten={handleShorten}
              onOpenQrModal={(url) => setQrModalUrl(url)}
            />

            {/* User Dashboard Link Table */}
            <LinkTable
              urls={urls}
              onSelectAnalytics={(code) => setSelectedAnalyticsShortCode(code)}
              onOpenQrModal={(url) => setQrModalUrl(url)}
              onEditLink={(item) => setEditUrlItem(item)}
              onDeleteLink={handleDeleteLink}
            />
          </>
        )}
      </main>

      {/* Technical Architecture Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 py-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">LinkSnap Serverless Architecture</p>
              <p className="text-[11px] text-slate-500">Node.js 20.x Lambdas • Amazon API Gateway • DynamoDB Single/Dual Table</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>AWS SAM Infrastructure as Code</span>
            </span>
            <span className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>DynamoDB Pay-Per-Request</span>
            </span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anonymized GeoIP & Telemetry</span>
            </span>
          </div>

        </div>
      </footer>

      {/* Modals */}
      <QrCodeModal url={qrModalUrl} onClose={() => setQrModalUrl(null)} />
      <EditSlugModal
        urlItem={editUrlItem}
        onClose={() => setEditUrlItem(null)}
        onSave={handleSaveEdit}
      />

    </div>
  );
};

export default App;
