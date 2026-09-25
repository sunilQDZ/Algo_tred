import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { StrategyBuilder } from './components/StrategyBuilder';
import { BacktestWorkspace } from './components/BacktestWorkspace';
import { AIOptimizer } from './components/AIOptimizer';
import { OptionsStrategyLab } from './components/OptionsStrategyLab';
import { MonteCarloSimulator } from './components/MonteCarloSimulator';
import { MarketRadar } from './components/MarketRadar';
import { TradingViewWebhooks } from './components/TradingViewWebhooks';
import { LiveDashboard } from './components/LiveDashboard';
import { BrokerManager } from './components/BrokerManager';
import { BillingManager } from './components/BillingManager';
import { RiskQuestionnaireModal } from './components/RiskQuestionnaireModal';
import { MarketingPage } from './components/MarketingPage';
import { AlgoSetuDemo } from './components/AlgoSetuDemo';
import { TradeJournal } from './components/TradeJournal';
import { User, Strategy } from './types';
import { api, setAuthToken } from './api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'marketing' | 'auth' | 'app'>('app');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('trader@algotred.com');
  const [password, setPassword] = useState('AlgoTred123!');
  const [fullName, setFullName] = useState('Rajesh Sharma');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    api.getCurrentUser()
      .then((u) => {
        setUser(u);
        setView('app');
        api.getStrategies().then((strats) => {
          if (strats.length > 0) setActiveStrategy(strats[0]);
        });
      })
      .catch(() => {
        handleDemoLogin();
      });
  }, []);

  const handleDemoLogin = async () => {
    try {
      const res = await api.login('trader@algotred.com', 'AlgoTred123!');
      setUser(res.user);
      setView('app');
      api.getStrategies().then((strats) => {
        if (strats.length > 0) setActiveStrategy(strats[0]);
      });
    } catch (e) {
      try {
        await api.register('trader@algotred.com', 'AlgoTred123!', 'Rajesh Sharma');
        const loginRes = await api.login('trader@algotred.com', 'AlgoTred123!');
        setUser(loginRes.user);
        setView('app');
        api.getStrategies().then((strats) => {
          if (strats.length > 0) setActiveStrategy(strats[0]);
        });
      } catch (err) {
        setUser({ id: 1, email: 'trader@algotred.com', full_name: 'Rajesh Sharma', risk_tolerance: 'balanced' } as any);
        setView('app');
      }
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        await api.register(email, password, fullName);
      }
      const res = await api.login(email, password);
      setUser(res.user);
      setView('app');
    } catch (err: any) {
      if (authMode === 'login' && email === 'trader@algotred.com') {
        try {
          await api.register('trader@algotred.com', 'AlgoTred123!', 'Rajesh Sharma');
          const res = await api.login('trader@algotred.com', 'AlgoTred123!');
          setUser(res.user);
          setView('app');
          return;
        } catch (regErr) {}
      }
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setView('marketing');
  };

  if (view === 'marketing') {
    return <MarketingPage onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6">
        <div className="glass-panel-glow w-full max-w-md p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Algo<span className="text-cyan-400">Tred</span> Account Access
            </h2>
            <p className="text-xs text-gray-400">Institutional Algorithmic Trading Suite</p>
          </div>

          {authError && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-400 text-xs rounded-xl">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="text-xs text-gray-400 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              {authMode === 'login' ? 'Log In to Platform' : 'Create Free Account'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-xs text-gray-400 hover:text-cyan-400 font-medium"
            >
              {authMode === 'login' ? "Don't have an account? Register" : "Already registered? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      <Navbar
        user={user}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="glass-panel-glow p-8 rounded-2xl space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Welcome Back</span>
                <h1 className="text-2xl font-bold text-white">AlgoTred Quantitative Trading Workspace</h1>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Design rules visually, build multi-leg options spreads, run 500-path Monte Carlo stress tests, evaluate Quant AI Neural Risk Recommendations, and execute automated orders on Zerodha & Dhan.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('algosetu')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    ✨ Launch AlgoSetu Interactive Demo
                  </button>
                  <button
                    onClick={() => setActiveTab('builder')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                  >
                    Build Strategy
                  </button>
                  <button
                    onClick={() => setActiveTab('options')}
                    className="px-4 py-2 rounded-xl bg-gray-800 text-cyan-400 border border-gray-700 font-semibold text-xs"
                  >
                    Options Strategy Lab
                  </button>
                </div>
              </div>

              <LiveDashboard />
            </div>
          )}

          {activeTab === 'algosetu' && <AlgoSetuDemo />}

          {activeTab === 'builder' && (
            <StrategyBuilder
              onStrategyCreated={(strat) => setActiveStrategy(strat)}
              onRunBacktest={(strat) => {
                setActiveStrategy(strat);
                setActiveTab('backtest');
              }}
            />
          )}

          {activeTab === 'backtest' && (
            <BacktestWorkspace
              strategy={activeStrategy}
              onOpenOptimizer={(strat) => {
                setActiveStrategy(strat);
                setActiveTab('optimizer');
              }}
              onOpenDeployment={(strat) => {
                setActiveStrategy(strat);
                setActiveTab('deployments');
              }}
            />
          )}

          {activeTab === 'optimizer' && (
            <AIOptimizer
              strategy={activeStrategy}
              onApplyConfig={(updatedParams) => {
                if (activeStrategy) {
                  const copy = { ...activeStrategy, params: updatedParams };
                  setActiveStrategy(copy);
                  setActiveTab('backtest');
                }
              }}
            />
          )}

          {activeTab === 'options' && <OptionsStrategyLab />}
          {activeTab === 'monte_carlo' && <MonteCarloSimulator />}
          {activeTab === 'market_radar' && <MarketRadar />}
          {activeTab === 'webhooks' && <TradingViewWebhooks />}
          {activeTab === 'deployments' && <LiveDashboard />}
          {activeTab === 'journal' && <TradeJournal />}
          {activeTab === 'brokers' && <BrokerManager />}
          {activeTab === 'billing' && <BillingManager />}
        </main>
      </div>

      <RiskQuestionnaireModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        user={user}
        onUpdateUser={(u) => setUser(u)}
      />
    </div>
  );
};
