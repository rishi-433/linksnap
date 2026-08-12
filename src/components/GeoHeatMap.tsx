import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { GeoPoint } from '../types';
import { Globe, MapPin } from 'lucide-react';

interface GeoHeatMapProps {
  geoDistribution: GeoPoint[];
}

export const GeoHeatMap: React.FC<GeoHeatMapProps> = ({ geoDistribution }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Interactive Map */}
      <div className="lg:col-span-2 relative h-80 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#0B0F19' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {geoDistribution.map((point) => (
            <CircleMarker
              key={point.country}
              center={[point.latitude || 20, point.longitude || 0]}
              radius={Math.max(6, Math.min(22, point.percentage / 2.5))}
              pathOptions={{
                color: '#22d3ee',
                fillColor: '#6366f1',
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-sm text-indigo-300 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{point.countryName}</span>
                  </div>
                  <div className="text-xs text-slate-200 mt-1">
                    Total Clicks: <strong className="text-cyan-400">{point.clicks}</strong> ({point.percentage}%)
                  </div>
                  {point.cities.length > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Top City: {point.cities[0].name} ({point.cities[0].clicks})
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Country Breakdown Progress Bars */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Geographic Distribution</h4>
          </div>

          <div className="space-y-3.5">
            {geoDistribution.slice(0, 5).map((item) => (
              <div key={item.country} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200 flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-indigo-300">[{item.country}]</span>
                    <span>{item.countryName}</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-white">{item.clicks}</strong> ({item.percentage}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center mt-4">
          <span>Real-Time GeoIP Mapping</span>
          <span className="text-indigo-400 font-semibold">{geoDistribution.length} Countries Tracked</span>
        </div>
      </div>

    </div>
  );
};
