import React from 'react';
import { Link2, Zap, Server, ShieldCheck, Github, Activity } from 'lucide-react';

interface NavbarProps {
  isMockMode: boolean;
  onToggleMode: (mock: boolean) => void;
  totalLinksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ isMockMode, onToggleMode, totalLinksCount }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Link2 className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                LinkSnap
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                v1.0 Serverless
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              High Performance Cloud URL Shortener & Analytics
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Active Links Count Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Links: <strong className="text-white font-semibold">{totalLinksCount}</strong></span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => onToggleMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                isMockMode
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Runs locally using responsive mock services & realistic persistent data"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Demo Mode</span>
            </button>
            <button
              onClick={() => onToggleMode(false)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                !isMockMode
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Connects to real AWS API Gateway & DynamoDB backend"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Live AWS</span>
            </button>
          </div>

          {/* Infrastructure Tag */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AWS SAM + DynamoDB</span>
          </div>

        </div>
      </div>
    </header>
  );
};
