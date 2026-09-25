import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Calculator, TrendingUp, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export const OptionsStrategyLab: React.FC = () => {
  const [spotPrice, setSpotPrice] = useState(24500);
  const [legs, setLegs] = useState([
    { option_type: 'CE', strike: 24500, action: 'BUY', premium: 180, qty: 25 },
    { option_type: 'CE', strike: 24700, action: 'SELL', premium: 85, qty: 25 }
  ]);

  const [payoffData, setPayoffData] = useState<any>(null);
  const [greeks, setGreeks] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/v1/options/greeks?spot=${spotPrice}&strike=${spotPrice}&days_to_expiry=7&volatility=0.16&option_type=CE`)
      .then(res => res.json())
      .then(setGreeks)
      .catch(console.error);

    fetch('/api/v1/options/payoff-matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spot_price: spotPrice, legs })
    })
      .then(res => res.json())
      .then(setPayoffData)
      .catch(console.error);
  }, [spotPrice, legs]);

  const applyPreset = (presetName: string) => {
    if (presetName === 'bull_call') {
      setLegs([
        { option_type: 'CE', strike: spotPrice, action: 'BUY', premium: 180, qty: 25 },
        { option_type: 'CE', strike: spotPrice + 200, action: 'SELL', premium: 85, qty: 25 }
      ]);
    } else if (presetName === 'bear_put') {
      setLegs([
        { option_type: 'PE', strike: spotPrice, action: 'BUY', premium: 170, qty: 25 },
        { option_type: 'PE', strike: spotPrice - 200, action: 'SELL', premium: 75, qty: 25 }
      ]);
    } else if (presetName === 'short_straddle') {
      setLegs([
        { option_type: 'CE', strike: spotPrice, action: 'SELL', premium: 180, qty: 25 },
        { option_type: 'PE', strike: spotPrice, action: 'SELL', premium: 170, qty: 25 }
      ]);
    } else if (presetName === 'iron_condor') {
      setLegs([
        { option_type: 'PE', strike: spotPrice - 300, action: 'BUY', premium: 35, qty: 25 },
        { option_type: 'PE', strike: spotPrice - 150, action: 'SELL', premium: 90, qty: 25 },
        { option_type: 'CE', strike: spotPrice + 150, action: 'SELL', premium: 95, qty: 25 },
        { option_type: 'CE', strike: spotPrice + 300, action: 'BUY', premium: 40, qty: 25 }
      ]);
    }
  };

  const addLeg = () => {
    setLegs([...legs, { option_type: 'PE', strike: spotPrice - 100, action: 'BUY', premium: 120, qty: 25 }]);
  };

  const removeLeg = (idx: number) => {
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const updateLeg = (idx: number, field: string, value: any) => {
    const copy = [...legs];
    (copy[idx] as any)[field] = value;
    setLegs(copy);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            NSE Options Derivatives Strategy Lab
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Build Multi-Leg Options Spreads (Iron Condor, Bull Call Spread, Short Straddle) with Black-Scholes Greeks & Expiry Payoff Curves.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs">
          <span className="text-gray-400">NIFTY Spot:</span>
          <input
            type="number"
            value={spotPrice}
            onChange={(e) => setSpotPrice(parseFloat(e.target.value))}
            className="bg-transparent font-bold text-cyan-400 font-mono w-24 outline-none"
          />
        </div>
      </div>

      {/* Greeks Table Banner */}
      {greeks && (
        <div className="glass-panel-glow p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">ATM Option Price</span>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">₹{greeks.price}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Delta (Δ)</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{greeks.delta}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Gamma (Γ)</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{greeks.gamma}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Theta (Θ / day)</span>
            <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{greeks.theta}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Vega (ν / 1% IV)</span>
            <div className="text-lg font-bold text-violet-400 font-mono mt-0.5">{greeks.vega}</div>
          </div>
        </div>
      )}

      {/* Multi-leg Option Legs Builder */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Leg Strategy Builder</h3>
            <p className="text-[11px] text-gray-400">Quick-load popular Indian Options Spread Presets:</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => applyPreset('bull_call')} className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-cyan-400 border border-cyan-800/60 text-[11px] font-semibold">
              Bull Call Spread
            </button>
            <button onClick={() => applyPreset('bear_put')} className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-rose-400 border border-rose-800/60 text-[11px] font-semibold">
              Bear Put Spread
            </button>
            <button onClick={() => applyPreset('short_straddle')} className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-amber-400 border border-amber-800/60 text-[11px] font-semibold">
              Short Straddle
            </button>
            <button onClick={() => applyPreset('iron_condor')} className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-purple-400 border border-purple-800/60 text-[11px] font-semibold">
              Iron Condor
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400 font-semibold">Legs Configuration:</span>
          <button onClick={addLeg} className="flex items-center gap-1 text-xs text-cyan-400 font-semibold hover:text-cyan-300">
            <Plus className="w-3.5 h-3.5" /> Add Option Leg
          </button>
        </div>

        <div className="space-y-3">
          {legs.map((leg, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 bg-gray-900/80 p-3 rounded-xl border border-gray-800">
              <select
                value={leg.action}
                onChange={(e) => updateLeg(idx, 'action', e.target.value)}
                className={`border rounded-lg px-3 py-1.5 text-xs font-bold ${
                  leg.action === 'BUY' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                <option value="BUY">BUY (+)</option>
                <option value="SELL">SELL (-)</option>
              </select>

              <select
                value={leg.option_type}
                onChange={(e) => updateLeg(idx, 'option_type', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="CE">Call (CE)</option>
                <option value="PE">Put (PE)</option>
              </select>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">Strike:</span>
                <input
                  type="number"
                  step="50"
                  value={leg.strike}
                  onChange={(e) => updateLeg(idx, 'strike', parseFloat(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono w-24"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">Premium:</span>
                <input
                  type="number"
                  value={leg.premium}
                  onChange={(e) => updateLeg(idx, 'premium', parseFloat(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-mono w-20"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">Qty:</span>
                <input
                  type="number"
                  step="25"
                  value={leg.qty}
                  onChange={(e) => updateLeg(idx, 'qty', parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono w-20"
                />
              </div>

              <button onClick={() => removeLeg(idx)} className="text-gray-500 hover:text-rose-400 ml-auto">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payoff Diagram Chart */}
      {payoffData && payoffData.payoff_curve && payoffData.payoff_curve.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Expiry Profit & Loss Payoff Diagram
            </h3>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>Max Profit: <strong className="text-emerald-400">₹{payoffData.max_profit}</strong></div>
              <div>Max Loss: <strong className="text-rose-400">₹{payoffData.max_loss}</strong></div>
              <div>Breakevens: <strong className="text-cyan-400">{payoffData.breakevens?.join(', ') || 'N/A'}</strong></div>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoffData.payoff_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="underlying_price" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }} />
                <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="payoff" name="Expiry P&L (INR)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
