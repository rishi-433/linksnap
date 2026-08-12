import React, { useState } from 'react';
import { UrlItem } from '../types';
import { Search, Copy, QrCode, BarChart3, Edit, Trash2, ExternalLink, Check, Calendar } from 'lucide-react';
import { getShortUrl } from '../services/api';

interface LinkTableProps {
  urls: UrlItem[];
  onSelectAnalytics: (shortCode: string) => void;
  onOpenQrModal: (shortUrl: string) => void;
  onEditLink: (urlItem: UrlItem) => void;
  onDeleteLink: (url_id: string) => void;
}

export const LinkTable: React.FC<LinkTableProps> = ({
  urls,
  onSelectAnalytics,
  onOpenQrModal,
  onEditLink,
  onDeleteLink,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleCopy = (shortCode: string) => {
    const fullUrl = getShortUrl(shortCode);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shortCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering
  const filteredUrls = urls.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUrls.length / itemsPerPage) || 1;
  const paginatedUrls = filteredUrls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Your Shortened Links</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold">
              {filteredUrls.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">Manage, preview, and audit real-time traffic statistics</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search links..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => { setStatusFilter('expired'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'expired' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <th className="py-3.5 px-4">Link Details</th>
              <th className="py-3.5 px-4">Short Code</th>
              <th className="py-3.5 px-4">Total Clicks</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {paginatedUrls.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  No shortened links found matching your query.
                </td>
              </tr>
            ) : (
              paginatedUrls.map((item) => {
                const shortUrl = getShortUrl(item.url_id);
                const isCopied = copiedId === item.url_id;

                return (
                  <tr key={item.url_id} className="hover:bg-slate-800/40 transition-colors group">
                    
                    {/* Title & Original URL */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate text-sm">
                        {item.title || item.url_id}
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400 truncate mt-0.5">
                        <span className="truncate max-w-[200px]">{item.original_url}</span>
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-indigo-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Short Code & Copy */}
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono font-bold">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-cyan-300 transition-colors"
                          title="Click to test redirect in new tab"
                        >
                          {item.url_id}
                        </a>
                        <button
                          onClick={() => handleCopy(item.url_id)}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Total Clicks */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-sm text-cyan-400 flex items-center space-x-1">
                        <span>{item.total_clicks.toLocaleString()}</span>
                        <span className="text-[10px] font-normal text-slate-400">clicks</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {item.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Analytics Button */}
                        <button
                          onClick={() => onSelectAnalytics(item.url_id)}
                          className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all border border-indigo-500/30"
                          title="View Real-Time Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* QR Code */}
                        <button
                          onClick={() => onOpenQrModal(shortUrl)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                          title="Generate QR Code"
                        >
                          <QrCode className="w-4 h-4 text-cyan-400" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditLink(item)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteLink(item.url_id)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/20"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Showing Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
