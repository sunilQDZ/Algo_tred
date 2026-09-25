import React from 'react';
import { ShieldAlert, Zap, User as UserIcon, LogOut, Bell, ChevronDown } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenRiskModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenRiskModal, onLogout }) => {
  return (
    <header className="h-16 border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white">Algo<span className="text-cyan-400">Tred</span></span>
          <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            NSE / BSE AI
          </span>
        </div>
      </div>

      {/* Center Market Status */}
      <div className="hidden md:flex items-center gap-6 text-xs text-gray-400 bg-gray-900/70 border border-gray-800 px-4 py-1.5 rounded-full">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-gray-200">NSE Live</span>
        </div>
        <div className="h-3 w-[1px] bg-gray-800"></div>
        <div>NIFTY 50: <span className="text-emerald-400 font-semibold font-mono">19,540.20 (+0.45%)</span></div>
        <div className="h-3 w-[1px] bg-gray-800"></div>
        <div>BANKNIFTY: <span className="text-rose-400 font-semibold font-mono">44,120.80 (-0.12%)</span></div>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenRiskModal}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-cyan-500/50 transition-all text-gray-300 hover:text-white"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Risk Profile: <strong className="capitalize text-cyan-400">{user?.risk_profile?.tolerance || 'Moderate'}</strong></span>
        </button>

        <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-700 flex items-center justify-center font-bold text-sm text-cyan-400">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-white truncate max-w-[120px]">{user?.full_name || user?.email || 'Trader'}</div>
            <div className="text-[10px] text-gray-400">{user?.subscription_plan || 'FREE'} PLAN</div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-gray-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
