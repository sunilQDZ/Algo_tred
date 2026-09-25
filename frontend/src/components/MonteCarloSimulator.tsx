import React, { useState, useEffect } from 'react';
import { Activity, Play, ShieldAlert, BarChart2, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MonteCarloSimulator: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState(200000);
  const [forecastDays, setForecastDays] = useState(60);
  const [simData, setSimData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    fetch('/api/v1/analytics/monte-carlo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initial_capital: initialCapital, forecast_days: forecastDays, num_simulations: 500 })
    })
      .then(res => res.json())
      .then(setSimData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Monte Carlo 500-Path Risk Simulator & Value at Risk (VaR)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simulate 500 stochastic future price trajectories to quantify portfolio tail risk, 95% VaR & market crash survival probabilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <span>Forecast Period:</span>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none text-cyan-400 font-semibold"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{loading ? 'Simulating...' : 'Run Monte Carlo'}</span>
          </button>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      {simData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <span className="text-[11px] text-gray-400 font-medium">95% Value at Risk (VaR)</span>
            <div className="text-lg font-bold text-rose-400 font-mono mt-1">{simData.var_95_pct}%</div>
            <span className="text-[10px] text-gray-500">Max loss in 95% of cases</span>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-[11px] text-gray-400 font-medium">99% Extreme VaR</span>
            <div className="text-lg font-bold text-rose-500 font-mono mt-1">{simData.var_99_pct}%</div>
            <span className="text-[10px] text-gray-500">Worst 1% market crash</span>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-[11px] text-gray-400 font-medium">Expected Tail Loss (CVaR)</span>
            <div className="text-lg font-bold text-orange-400 font-mono mt-1">{simData.cvar_95_pct}%</div>
            <span className="text-[10px] text-gray-500">Average loss beyond VaR</span>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-[11px] text-gray-400 font-medium">Median Expected Equity</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">₹{simData.median_final_equity?.toLocaleString()}</div>
            <span className="text-[10px] text-gray-500">Best: ₹{simData.best_case_final_equity?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Simulation Percentile Trajectory Chart */}
      {simData && simData.percentile_paths && simData.percentile_paths.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            500 Stochastic Path Simulation Bounds
          </h3>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simData.percentile_paths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="percentile_90" name="90th Percentile (Bull Case)" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="median" name="50th Percentile (Median)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="percentile_10" name="10th Percentile (Bear Case)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="worst_case" name="Worst Case Tail" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
