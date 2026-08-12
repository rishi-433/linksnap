import React, { useState } from 'react';
import { Link, Sparkles, Copy, QrCode, Check, AlertCircle, Calendar, Hash, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { ShortenUrlRequest, ShortenUrlResponse } from '../types';
import confetti from 'canvas-confetti';

interface UrlShortenerFormProps {
  onShorten: (payload: ShortenUrlRequest) => Promise<ShortenUrlResponse>;
  onOpenQrModal: (url: string) => void;
}

export const UrlShortenerForm: React.FC<UrlShortenerFormProps> = ({ onShorten, onOpenQrModal }) => {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<ShortenUrlResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const validateUrl = (input: string): boolean => {
    if (!input) return false;
    try {
      const parsed = new URL(input);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleShortenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a destination URL.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (!validateUrl(cleanUrl)) {
      setError('Invalid URL format. Please enter a valid address (e.g., https://example.com/path).');
      return;
    }

    if (customSlug) {
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customSlug.trim())) {
        setError('Custom slug must be 3-30 characters long and contain only letters, numbers, hyphens, or underscores.');
        return;
      }
    }

    try {
      setLoading(true);
      const res = await onShorten({
        originalUrl: cleanUrl,
        customSlug: customSlug.trim() || undefined,
        expiresAt: expiresAt || undefined,
        title: title.trim() || undefined,
      });

      setCreatedResult(res);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });

      // Clear fields
      setUrl('');
      setCustomSlug('');
      setTitle('');
      setExpiresAt('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while shortening your URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        {/* Badge Header */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen URL Shortener & Telemetry Hub</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.15]">
          Shorten Links.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
            Track Analytics in Real Time.
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Create lightning-fast custom short links powered by AWS Lambda & DynamoDB with granular geo-heatmaps, device telemetry, and QR generation.
        </p>

        {/* Shortener Card Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl shadow-indigo-950/40 border border-slate-700/60 text-left">
          <form onSubmit={handleShortenSubmit} className="space-y-4">
            
            {/* Primary Input Bar */}
            <div className="relative flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Link className="w-5 h-5 text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long link here (e.g. https://github.com/aws/aws-sam-cli)..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base font-medium transition-all shadow-inner"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Shortening...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Shorten Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Toggle Advanced Options */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showAdvanced ? 'Hide Advanced Options' : 'Custom Slug, Title & Expiration Options'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
                  
                  {/* Custom Slug Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Custom Alias / Slug</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-500 pointer-events-none">
                        {typeof window !== 'undefined' ? `${window.location.host}/r/` : 'r/'}
                      </span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        placeholder="my-custom-link"
                        className="w-full pl-24 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Title / Alias Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Link Title (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Q3 Launch Campaign"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Expiration Date Picker */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Expiration Date</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                </div>
              )}
            </div>

          </form>

          {/* Success Banner Card */}
          {createdResult && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 shadow-xl space-y-3 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Short Link Created Successfully!</span>
                </div>
                <span className="text-xs text-slate-400">ID: <code className="text-indigo-300">{createdResult.shortCode}</code></span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="truncate w-full">
                  <a
                    href={createdResult.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base sm:text-lg font-bold text-cyan-400 hover:underline truncate block"
                  >
                    {createdResult.shortUrl}
                  </a>
                  <p className="text-xs text-slate-400 truncate">
                    Destination: <span className="text-slate-300">{createdResult.originalUrl}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleCopyLink(createdResult.shortUrl)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => onOpenQrModal(createdResult.shortUrl)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center transition-all border border-slate-700"
                    title="Generate QR Code"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
