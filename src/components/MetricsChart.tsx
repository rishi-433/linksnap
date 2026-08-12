import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TimeSeriesPoint } from '../types';

interface MetricsChartProps {
  data: TimeSeriesPoint[];
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            }}
            itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
            labelStyle={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            name="Total Clicks"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#clickGradient)"
          />
          <Area
            type="monotone"
            dataKey="uniqueVisitors"
            name="Unique Visitors"
            stroke="#22d3ee"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#visitorGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
