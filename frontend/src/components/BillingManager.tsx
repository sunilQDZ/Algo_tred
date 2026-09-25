import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, Shield, Sparkles } from 'lucide-react';
import { api } from '../api';

export const BillingManager: React.FC = () => {
  const [subInfo, setSubInfo] = useState<any>(null);

  useEffect(() => {
    api.getSubscription().then(setSubInfo).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          Subscription Plans & Razorpay Payment Integration
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Indian UPI, Netbanking & Credit Card automated subscription billing. Enforced backend deployment limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-400">Free Tier</span>
          <div className="text-3xl font-extrabold text-white font-mono">₹0 <span className="text-xs text-gray-400 font-sans">/ month</span></div>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Active Paper Deployment</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 Backtests / day</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 15 Optuna Trials</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="glass-panel-glow p-6 rounded-2xl space-y-4 border-2 border-cyan-500 relative">
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-cyan-500 to-emerald-400 text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            POPULAR
          </div>
          <span className="text-xs font-bold uppercase text-cyan-400">PRO TRADER</span>
          <div className="text-3xl font-extrabold text-white font-mono">₹2,999 <span className="text-xs text-gray-400 font-sans">/ month</span></div>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Active Live & Paper Deployments</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 100 Backtests / day</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Quant AI Strategy Recommendations</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Zerodha & Dhan Live Execution</li>
          </ul>
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20">
            Upgrade to Pro via Razorpay
          </button>
        </div>

        {/* Institutional Plan */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-gray-800">
          <span className="text-xs font-bold uppercase text-violet-400">INSTITUTIONAL</span>
          <div className="text-3xl font-extrabold text-white font-mono">₹9,999 <span className="text-xs text-gray-400 font-sans">/ month</span></div>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 25 Active Deployments</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Backtests</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated API & Support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
