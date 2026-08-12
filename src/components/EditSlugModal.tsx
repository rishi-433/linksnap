import React, { useState } from 'react';
import { X, Save, Edit3, Tag, Hash, Calendar } from 'lucide-react';
import { UrlItem } from '../types';

interface EditSlugModalProps {
  urlItem: UrlItem | null;
  onClose: () => void;
  onSave: (url_id: string, updates: Partial<UrlItem>) => Promise<void>;
}

export const EditSlugModal: React.FC<EditSlugModalProps> = ({ urlItem, onClose, onSave }) => {
  const [title, setTitle] = useState(urlItem?.title || '');
  const [customSlug, setCustomSlug] = useState(urlItem?.custom_slug || urlItem?.url_id || '');
  const [expiresAt, setExpiresAt] = useState(
    urlItem?.expires_at ? new Date(urlItem.expires_at).toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!urlItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await onSave(urlItem.url_id, {
        title: title.trim(),
        custom_slug: customSlug.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update link details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-950/50">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Edit Link Details</h3>
            <p className="text-xs text-slate-400">Update title, custom alias, or expiration date</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Link Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Descriptive Title"
            />
          </div>

          {/* Alias */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>Custom Slug</span>
            </label>
            <input
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="custom-slug"
            />
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Expiration Timestamp</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
