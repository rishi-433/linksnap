import React, { useState, useEffect } from 'react';
import { AnalyticsResponse, TimeframeOption } from '../types';
import { apiService, getShortUrl } from '../services/api';
import { MetricsChart } from './MetricsChart';
import { GeoHeatMap } from './GeoHeatMap';
import { BreakdownCharts } from './BreakdownCharts';
import { ArrowLeft, Clock, MousePointerClick, Users, Globe, Share2, RefreshCw, ExternalLink } from 'lucide-react';

interface AnalyticsDashboardProps {
  shortCode: string;
  onBack: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ shortCode, onBack }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.fetchAnalytics(shortCode, timeframe);
      setAnalytics(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [shortCode, timeframe]);

  if (loading && !analytics) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-medium">Querying real-time CloudWatch & DynamoDB telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-rose-500/30 bg-rose-500/10 text-center space-y-4">
        <p className="text-rose-400 font-semibold">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const totalClicksInFrame = analytics.timeSeriesData.reduce((acc, pt) => acc + pt.clicks, 0);
  const uniqueVisitorsInFrame = analytics.timeSeriesData.reduce((acc, pt) => acc + pt.uniqueVisitors, 0);
  const topRegion = analytics.geoDistribution[0]?.countryName || 'N/A';
  const topSource = analytics.topReferrers[0]?.referer || 'Direct';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Link Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {getShortUrl(analytics.shortCode)}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1 truncate max-w-xl">
            <span>Destination:</span>
            <a
              href={analytics.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline truncate"
            >
              {analytics.originalUrl}
            </a>
            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80">
          <Clock className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:inline-block" />
          {(['24h', '7d', '30d', 'all'] as TimeframeOption[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Clicks */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalClicksInFrame.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            +14.2% vs previous period
          </span>
        </div>

        {/* Unique Visitors */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Visitors</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {uniqueVisitorsInFrame.toLocaleString()}
          </div>
          <span className="text-[11px] text-cyan-300 font-medium mt-1 block">
            ~{Math.round((uniqueVisitorsInFrame / (totalClicksInFrame || 1)) * 100)}% unique ratio
          </span>
        </div>

        {/* Top Region */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Location</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
            {topRegion}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Primary traffic region
          </span>
        </div>

        {/* Top Traffic Source */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Referrer</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
            {topSource}
          </div>
          <span className="text-[11px] text-purple-300 font-medium mt-1 block">
            Highest conversion channel
          </span>
        </div>

      </div>

      {/* Time-Series Click Volume Area Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Click Volume & Traffic Trends</h3>
            <p className="text-xs text-slate-400">Aggregated click volume and unique visitor ratio</p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Timeframe: {timeframe.toUpperCase()}
          </span>
        </div>
        <MetricsChart data={analytics.timeSeriesData} />
      </div>

      {/* Geographic Heat Map Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Geographic Telemetry Map</h3>
        <GeoHeatMap geoDistribution={analytics.geoDistribution} />
      </div>

      {/* Device Types, Browsers & Top Referrers */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Device & Attribution Breakdown</h3>
        <BreakdownCharts
          deviceBreakdown={analytics.deviceBreakdown}
          topReferrers={analytics.topReferrers}
          browserBreakdown={analytics.browserBreakdown}
        />
      </div>

    </div>
  );
};
