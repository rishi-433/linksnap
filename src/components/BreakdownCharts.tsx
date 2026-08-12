import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { DevicePoint, ReferrerPoint, BrowserPoint } from '../types';
import { Monitor, Smartphone, Tablet, Share2, Compass } from 'lucide-react';

interface BreakdownChartsProps {
  deviceBreakdown: DevicePoint[];
  topReferrers: ReferrerPoint[];
  browserBreakdown: BrowserPoint[];
}

export const BreakdownCharts: React.FC<BreakdownChartsProps> = ({
  deviceBreakdown,
  topReferrers,
  browserBreakdown,
}) => {
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'desktop':
        return <Monitor className="w-4 h-4 text-indigo-400" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-purple-400" />;
      default:
        return <Monitor className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Device Breakdown Donut Chart */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>Device Breakdown</span>
          </h4>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="clicks"
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2">
            {deviceBreakdown.map((item) => (
              <div key={item.device} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 flex items-center space-x-1">
                    {getDeviceIcon(item.device)}
                    <span>{item.device}</span>
                  </span>
                </div>
                <span className="font-mono text-slate-400">
                  <strong className="text-white">{item.clicks}</strong> ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Referrers List */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Top Traffic Referrers</span>
          </h4>

          <div className="space-y-3">
            {topReferrers.map((item, idx) => (
              <div key={item.referer} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium truncate max-w-[160px]">
                    <span className="text-slate-500 mr-1 font-mono">#{idx + 1}</span> {item.referer}
                  </span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{item.clicks}</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.max(5, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browser Breakdown */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Browser Distribution</span>
          </h4>

          <div className="space-y-3">
            {browserBreakdown.map((item) => (
              <div key={item.browser} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{item.browser}</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{item.clicks}</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.max(5, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
