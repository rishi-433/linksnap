import React, { useEffect, useState } from 'react';
import { X, Download, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface QrCodeModalProps {
  url: string | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(
        url,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, code) => {
          if (!err && code) {
            setDataUrl(code);
          }
        }
      );
    }
  }, [url]);

  if (!url) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `linksnap-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-950/50">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">QR Code Generator</h3>
            <p className="text-xs text-slate-400 truncate max-w-[240px]">{url}</p>
          </div>
        </div>

        {/* QR Display */}
        <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-700 mb-6 shadow-inner">
          {dataUrl ? (
            <img src={dataUrl} alt="LinkSnap QR Code" className="w-56 h-56 rounded-xl" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copied ? 'Copied Link' : 'Copy Short Link'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>

      </div>
    </div>
  );
};
