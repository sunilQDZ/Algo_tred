import React from 'react';
import {
  LayoutDashboard, Sliders, TrendingUp, Cpu, Radio, Link2, CreditCard, Shield, Layers, Activity, Compass, Code, Sparkles, BookOpen
} from 'lucide-react';

export type TabType = 'dashboard' | 'builder' | 'backtest' | 'optimizer' | 'options' | 'monte_carlo' | 'market_radar' | 'webhooks' | 'deployments' | 'journal' | 'brokers' | 'billing' | 'algosetu';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'algosetu', label: 'AlgoSetu Interactive Demo', icon: Sparkles },
    { id: 'builder', label: 'Strategy Builder', icon: Sliders },
    { id: 'backtest', label: 'Backtest Engine', icon: TrendingUp },
    { id: 'optimizer', label: 'Quant AI Strategy Optimizer', icon: Cpu },
    { id: 'options', label: 'Options Strategy Lab', icon: Layers },
    { id: 'monte_carlo', label: 'Monte Carlo Simulator', icon: Activity },
    { id: 'market_radar', label: 'Market Sentiment Radar', icon: Compass },
    { id: 'webhooks', label: 'TradingView Webhooks', icon: Code },
    { id: 'deployments', label: 'Paper & Live Trading', icon: Radio },
    { id: 'journal', label: 'Trade Journal & Audit', icon: BookOpen },
    { id: 'brokers', label: 'Broker Accounts', icon: Link2 },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0b0f19] flex flex-col justify-between py-6 px-3 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Algo Trading Suite
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 text-[11px] text-gray-500 space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-gray-400">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>SEBI Compliance</span>
        </div>
        <p className="leading-snug text-[10px]">
          Algorithmic trading carries risk of loss. Past backtest performance does not guarantee future returns.
        </p>
      </div>
    </aside>
  );
};
