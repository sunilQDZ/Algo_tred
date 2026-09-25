import React, { useState, useEffect } from 'react';
import { Radio, AlertOctagon, Pause, Play, Square, Activity, DollarSign, Layers } from 'lucide-react';
import { LiveDeployment, Order, Position } from '../types';
import { api } from '../api';

export const LiveDashboard: React.FC = () => {
  const [deployments, setDeployments] = useState<LiveDeployment[]>([]);
  const [selectedDepId, setSelectedDepId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [wsTick, setWsTick] = useState<any>(null);

  useEffect(() => {
    api.getDeployments().then((deps) => {
      setDeployments(deps);
      if (deps.length > 0) setSelectedDepId(deps[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDepId) return;
    api.getOrders(selectedDepId).then(setOrders).catch(console.error);
    api.getPositions(selectedDepId).then(setPositions).catch(console.error);

    // Connect WebSocket for streaming real-time prices & P&L
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live/${selectedDepId}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setWsTick(data);
      } catch (e) {}
    };

    return () => socket.close();
  }, [selectedDepId]);

  const handleKillSwitch = async (depId: string) => {
    if (!confirm("Are you sure you want to trigger the EMERGENCY KILL SWITCH? This will stop execution and close all active positions immediately.")) return;
    try {
      const updated = await api.killDeployment(depId);
      setDeployments(deployments.map(d => d.id === depId ? updated : d));
      api.getOrders(depId).then(setOrders);
      api.getPositions(depId).then(setPositions);
    } catch (e) {
      console.error(e);
    }
  };

  const activeDep = deployments.find(d => d.id === selectedDepId);

  return (
    <div className="space-y-6">
      {/* Header & Deployment Switcher */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Paper & Live Trading Execution Dashboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time execution monitoring, streaming position P&L & emergency risk controls.
          </p>
        </div>

        {activeDep && (
          <button
            onClick={() => handleKillSwitch(activeDep.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>EMERGENCY KILL SWITCH</span>
          </button>
        )}
      </div>

      {/* Deployments List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deployments.map((dep) => {
          const isSelected = dep.id === selectedDepId;
          return (
            <div
              key={dep.id}
              onClick={() => setSelectedDepId(dep.id)}
              className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                  dep.mode === 'LIVE' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}>
                  {dep.mode} TRADING
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  dep.status === 'RUNNING' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                }`}>
                  {dep.status}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-gray-400">Allocated Capital</span>
                <div className="text-lg font-bold text-white font-mono">₹{dep.capital_allocated.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WebSocket Real-time Ticker Stream Banner */}
      {wsTick && (
        <div className="glass-panel-glow p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Live LTP</span>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">₹{wsTick.ltp}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Unrealized P&L</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${wsTick.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {wsTick.unrealized_pnl > 0 ? '+' : ''}₹{wsTick.unrealized_pnl}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Realized P&L</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">₹{wsTick.realized_pnl}</div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Net Combined P&L</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${wsTick.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {wsTick.total_pnl > 0 ? '+' : ''}₹{wsTick.total_pnl}
            </div>
          </div>
        </div>
      )}

      {/* Active Positions Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Active Symbol Open Positions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 font-semibold">
              <tr>
                <th className="p-3">Symbol</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Avg Price</th>
                <th className="p-3">Current LTP</th>
                <th className="p-3">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {positions.map((pos) => (
                <tr key={pos.id}>
                  <td className="p-3 font-bold text-white">{pos.symbol}</td>
                  <td className="p-3 text-cyan-400 font-semibold">{pos.qty}</td>
                  <td className="p-3 text-gray-300">₹{pos.avg_price}</td>
                  <td className="p-3 text-gray-300">₹{wsTick?.ltp || pos.current_price}</td>
                  <td className={`p-3 font-bold ${(wsTick?.unrealized_pnl || pos.unrealized_pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(wsTick?.unrealized_pnl || pos.unrealized_pnl) > 0 ? '+' : ''}₹{wsTick?.unrealized_pnl || pos.unrealized_pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Orders History */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Order Audit Trail Log (Immutable Record)
        </h3>

        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 font-semibold sticky top-0">
              <tr>
                <th className="p-3">Client Order ID</th>
                <th className="p-3">Broker Order ID</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Side</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Filled Price</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-900/40">
                  <td className="p-3 text-cyan-300">{ord.client_order_id}</td>
                  <td className="p-3 text-gray-400">{ord.broker_order_id || 'N/A'}</td>
                  <td className="p-3 text-white font-semibold">{ord.symbol}</td>
                  <td className={`p-3 font-bold ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{ord.side}</td>
                  <td className="p-3 text-gray-200">{ord.qty}</td>
                  <td className="p-3 text-gray-200">₹{ord.filled_price}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
