import React from 'react';
import { Zap, ShieldCheck, Cpu, TrendingUp, Radio, ArrowRight } from 'lucide-react';

interface MarketingPageProps {
  onGetStarted: () => void;
}

export const MarketingPage: React.FC<MarketingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Hero Navbar */}
      <nav className="h-20 border-b border-gray-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Algo<span className="text-cyan-400">Tred</span></span>
        </div>

        <button
          onClick={onGetStarted}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          Launch Trading App
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold">
          <SparklesIcon className="w-3.5 h-3.5" /> Next-Gen AI Algorithmic Trading for Indian Markets
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Build, Backtest & Deploy Trading Algos <br />
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            No Code Required. Powered by Quant AI.
          </span>
        </h1>

        <p className="text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
          Empower your retail trading with institutional-grade strategy rule building, Optuna hyperparameter optimization, and automated Zerodha Kite / Dhan order execution.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all"
          >
            <span>Start Paper Trading Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <SlidersIcon className="w-8 h-8 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Visual No-Code Builder</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Combine RSI, EMA, Supertrend, Bollinger Bands & VWAP into structured rules without writing code.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <Cpu className="w-8 h-8 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Quant AI Optimization</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Advanced Quant Neural Engine analyzes out-of-sample Optuna backtests and provides institutional risk trade-off advice.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <Radio className="w-8 h-8 text-violet-400" />
          <h3 className="text-lg font-bold text-white">Zerodha & Dhan Execution</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Automate live orders directly via official Indian broker APIs with idempotent risk controls & kill switches.</p>
        </div>
      </section>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const SlidersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);
