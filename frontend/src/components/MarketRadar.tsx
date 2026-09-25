import React, { useState, useEffect } from 'react';
import { Compass, Flame, TrendingUp, TrendingDown, Zap, BarChart } from 'lucide-react';

export const MarketRadar: React.FC = () => {
  const [radar, setRadar] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/analytics/market-radar')
      .then(res => res.json())
      .then(setRadar)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          NSE Market Sentiment & Sector Heatmap Radar
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Real-time Fear & Greed Index, India VIX, FII/DII Net Cash Flows, and Volume Spike Radar.
        </p>
      </div>

      {radar && radar.sentiment_index && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sentiment Gauge Card */}
          <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">Market Sentiment Gauge</span>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-extrabold text-emerald-400 font-mono">{radar.sentiment_index.score} / 100</div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{radar.sentiment_index.status}</span>
              </div>
              <div className="text-right text-xs space-y-1">
                <div>India VIX: <strong className="text-cyan-400 font-mono">{radar.sentiment_index.india_vix}</strong></div>
                <div>FII/DII Net: <strong className="text-emerald-400 font-mono">{radar.sentiment_index.fii_dii_net_inr_cr}</strong></div>
              </div>
            </div>
          </div>

          {/* Sector Heatmap */}
          {radar.sectors && (
            <div className="glass-panel p-6 rounded-2xl space-y-4 col-span-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                NSE Sector Performance Heatmap
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {radar.sectors.map((sec: any) => (
                  <div key={sec.name} className={`p-3 rounded-xl border ${
                    sec.change_pct >= 0 ? 'border-emerald-800 bg-emerald-950/30' : 'border-rose-800 bg-rose-950/30'
                  }`}>
                    <span className="text-xs font-bold text-white">{sec.name}</span>
                    <div className={`text-base font-bold font-mono mt-1 ${sec.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sec.change_pct > 0 ? '+' : ''}{sec.change_pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Volume Spike Radar */}
      {radar && radar.volume_breakouts && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Institutional Volume Spike Breakout Radar
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 font-semibold">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">LTP (INR)</th>
                  <th className="p-3">Change %</th>
                  <th className="p-3">Volume Spike Multiple</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {radar.volume_breakouts.map((b: any) => (
                  <tr key={b.symbol}>
                    <td className="p-3 font-bold text-white">{b.symbol}</td>
                    <td className="p-3 text-gray-200">₹{b.ltp}</td>
                    <td className={`p-3 font-bold ${b.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {b.change_pct > 0 ? '+' : ''}{b.change_pct}%
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800">
                        ⚡ {b.volume_spike_ratio}x Avg Vol
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
