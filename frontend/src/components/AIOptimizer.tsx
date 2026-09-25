import React, { useState } from 'react';
import { Cpu, Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle, BarChart3 } from 'lucide-react';
import { Strategy, OptimizationRun, OptimizationResult } from '../types';
import { api } from '../api';

interface AIOptimizerProps {
  strategy: Strategy | null;
  onApplyConfig: (updatedParams: Record<string, any>) => void;
}

export const AIOptimizer: React.FC<AIOptimizerProps> = ({ strategy, onApplyConfig }) => {
  const [nTrials, setNTrials] = useState(35);
  const [loading, setLoading] = useState(false);
  const [optimizationRun, setOptimizationRun] = useState<OptimizationRun | null>(null);

  React.useEffect(() => {
    if (strategy) {
      api.getLatestOptimization(strategy.id)
        .then(setOptimizationRun)
        .catch(() => setOptimizationRun(null));
    }
  }, [strategy]);

  const handleRunOptimization = async () => {
    if (!strategy) return;
    setLoading(true);
    try {
      const searchSpace = {
        rsi_period: [10, 14, 21, 28],
        stop_loss_pct: [1.0, 1.5, 2.0, 2.5],
        target_pct: [2.5, 3.0, 4.0, 5.0]
      };
      const res = await api.runOptimization(strategy.id, searchSpace, nTrials);
      setOptimizationRun(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Quant AI Strategy & Risk Optimization
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Optuna hyperparameter search + out-of-sample stress testing paired with Quant Neural Risk Engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <span>Optuna Trials:</span>
            <select
              value={nTrials}
              onChange={(e) => setNTrials(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none text-cyan-400 font-semibold"
            >
              <option value={15}>15 Trials</option>
              <option value={20}>20 Trials</option>
              <option value={35}>35 Trials</option>
              <option value={50}>50 Trials</option>
            </select>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={loading || !strategy}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>{loading ? 'Running Quant AI Optimizer...' : 'Run Quant AI Optimization'}</span>
          </button>
        </div>
      </div>

      {/* Quant AI Risk & Strategy Summary Card */}
      {optimizationRun && optimizationRun.ai_summary && (
        <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Quant AI Strategy Analysis & Risk Recommendation</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              AlgoTred Neural Engine v2.4
            </span>
          </div>

          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-sans">
            {optimizationRun.ai_summary}
          </div>
        </div>
      )}

      {/* Ranked Parameter Configurations Table */}
      {optimizationRun && optimizationRun.top_n_results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Ranked Out-Of-Sample Parameter Configurations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizationRun.top_n_results.map((res: OptimizationResult) => {
              const isRecommended = res.rank === (optimizationRun.ai_recommended_config_idx || 1);
              return (
                <div
                  key={res.rank}
                  className={`glass-panel p-5 rounded-2xl space-y-4 border transition-all ${
                    isRecommended
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                      : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isRecommended ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-300'
                      }`}>
                        #{res.rank}
                      </span>
                      <span className="font-bold text-sm text-white">Config Option #{res.rank}</span>
                    </div>

                    {isRecommended && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> Recommended for Risk Profile
                      </span>
                    )}
                  </div>

                  {/* Parameter badges */}
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {Object.entries(res.params).map(([k, v]) => (
                      <span key={k} className="bg-gray-900 text-cyan-300 px-2.5 py-1 rounded-lg border border-gray-800">
                        {k}: <strong className="text-white">{String(v)}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Train vs Test Metrics comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">In-Sample Train CAGR</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{res.train_metrics.cagr_pct}%</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Out-Of-Sample Test Sharpe</span>
                      <div className="font-bold text-cyan-400 mt-0.5">{res.test_metrics.sharpe_ratio}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onApplyConfig(res.params)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-800 hover:bg-cyan-500 hover:text-black text-cyan-400 font-semibold text-xs transition-all border border-gray-700 hover:border-cyan-400"
                  >
                    <span>Use This Configuration</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
