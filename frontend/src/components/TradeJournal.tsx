import React, { useState } from 'react';
import { BookOpen, Filter, Search, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  strategy_name: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number;
  quantity: number;
  gross_pnl: number;
  net_pnl: number;
  charges: number;
  status: 'EXECUTED' | 'MANUAL_VERIFIED' | 'SKIPPED';
  automation_mode: 'Signal-Only' | 'One-Tap' | 'Automated';
  broker: 'Zerodha' | 'Dhan' | 'Paper Trade';
  notes: string;
}

const SAMPLE_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "JRN-8942",
    timestamp: "2026-09-10 10:15:00",
    symbol: "RELIANCE",
    strategy_name: "SMA 6/30 Crossover",
    signal_type: "BUY",
    entry_price: 2920.50,
    exit_price: 2954.80,
    quantity: 50,
    gross_pnl: 1715.00,
    net_pnl: 1540.20,
    charges: 174.80,
    status: "EXECUTED",
    automation_mode: "Signal-Only",
    broker: "Zerodha",
    notes: "Signal verified on 15m chart. Clean breakout above Vwap."
  },
  {
    id: "JRN-8941",
    timestamp: "2026-09-10 09:45:00",
    symbol: "BANKNIFTY 51200 CE",
    strategy_name: "Options Scalper Delta-Neutral",
    signal_type: "BUY",
    entry_price: 340.00,
    exit_price: 368.50,
    quantity: 150,
    gross_pnl: 4275.00,
    net_pnl: 3950.00,
    charges: 325.00,
    status: "EXECUTED",
    automation_mode: "One-Tap",
    broker: "Dhan",
    notes: "Target 25 pts hit within 8 minutes."
  },
  {
    id: "JRN-8940",
    timestamp: "2026-09-09 14:20:00",
    symbol: "TCS",
    strategy_name: "RSI Oversold Reversal",
    signal_type: "BUY",
    entry_price: 4190.00,
    exit_price: 4175.00,
    quantity: 25,
    gross_pnl: -375.00,
    net_pnl: -460.00,
    charges: 85.00,
    status: "EXECUTED",
    automation_mode: "Signal-Only",
    broker: "Zerodha",
    notes: "Stop loss triggered at 1.5% limit."
  },
  {
    id: "JRN-8939",
    timestamp: "2026-09-09 11:05:00",
    symbol: "HDFCBANK",
    strategy_name: "Supertrend Trend Follower",
    signal_type: "BUY",
    entry_price: 1640.00,
    exit_price: 1662.00,
    quantity: 100,
    gross_pnl: 2200.00,
    net_pnl: 1980.00,
    charges: 220.00,
    status: "MANUAL_VERIFIED",
    automation_mode: "Signal-Only",
    broker: "Zerodha",
    notes: "Manually entered order after chart verification."
  }
];

export const TradeJournal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const filtered = SAMPLE_JOURNAL_ENTRIES.filter((e) => {
    const matchesSearch = e.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.strategy_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'ALL' || e.automation_mode === filterMode;
    return matchesSearch && matchesFilter;
  });

  const totalNetPnl = filtered.reduce((acc, item) => acc + item.net_pnl, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Trade Journal & Signal Audit Log
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Complete audit history of generated signals, verified chart entries, net P&L, statutory costs & post-trade notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <span className="text-gray-400">Total Net Realized P&L: </span>
            <strong className={`font-mono ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetPnl >= 0 ? '+' : ''}₹{totalNetPnl.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Symbol (RELIANCE, TCS) or Strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Execution Tier:</span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-transparent border-none outline-none text-cyan-400 font-semibold cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="Signal-Only">Signal-Only</option>
            <option value="One-Tap">One-Tap</option>
            <option value="Automated">Automated</option>
          </select>
        </div>
      </div>

      {/* Journal Table */}
      <div className="glass-panel rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950/60 text-gray-400 font-semibold uppercase text-[10px]">
              <th className="p-4">Timestamp & ID</th>
              <th className="p-4">Symbol</th>
              <th className="p-4">Strategy</th>
              <th className="p-4">Type</th>
              <th className="p-4">Entry / Exit</th>
              <th className="p-4">Gross P&L</th>
              <th className="p-4">Taxes & Costs</th>
              <th className="p-4">Net P&L</th>
              <th className="p-4">Mode / Broker</th>
              <th className="p-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-gray-300">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="p-4 whitespace-nowrap">
                  <div className="font-mono text-gray-200">{item.timestamp}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{item.id}</div>
                </td>
                <td className="p-4 font-bold text-white whitespace-nowrap">{item.symbol}</td>
                <td className="p-4 text-cyan-400 font-medium whitespace-nowrap">{item.strategy_name}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    item.signal_type === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {item.signal_type}
                  </span>
                </td>
                <td className="p-4 font-mono whitespace-nowrap">
                  ₹{item.entry_price} $\rightarrow$ ₹{item.exit_price}
                  <div className="text-[10px] text-gray-500">Qty: {item.quantity}</div>
                </td>
                <td className="p-4 font-mono font-semibold whitespace-nowrap text-gray-200">
                  {item.gross_pnl >= 0 ? '+' : ''}₹{item.gross_pnl.toLocaleString()}
                </td>
                <td className="p-4 font-mono text-rose-400 whitespace-nowrap">
                  -₹{item.charges}
                </td>
                <td className="p-4 font-mono font-bold whitespace-nowrap">
                  <span className={item.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {item.net_pnl >= 0 ? '+' : ''}₹{item.net_pnl.toLocaleString()}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="text-[11px] font-semibold text-gray-300">{item.automation_mode}</div>
                  <div className="text-[10px] text-gray-500">{item.broker}</div>
                </td>
                <td className="p-4 text-gray-400 max-w-xs truncate">{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
