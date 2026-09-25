import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Save, Play, Sparkles, BookOpen, Check, ArrowRight } from 'lucide-react';
import { Strategy, StrategyTemplate, IndicatorCondition } from '../types';
import { api } from '../api';

interface StrategyBuilderProps {
  onStrategyCreated: (strat: Strategy) => void;
  onRunBacktest: (strat: Strategy) => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onStrategyCreated, onRunBacktest }) => {
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const [name, setName] = useState('My Custom Intraday Strategy');
  const [symbol, setSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('15m');
  const [segment, setSegment] = useState('EQUITY');

  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [entryConditions, setEntryConditions] = useState<IndicatorCondition[]>([
    { indicator: 'RSI', params: { period: 14 }, operator: '<', value: 30 }
  ]);
  const [exitConditions, setExitConditions] = useState<IndicatorCondition[]>([
    { indicator: 'RSI', params: { period: 14 }, operator: '>', value: 70 }
  ]);

  const [stopLossPct, setStopLossPct] = useState<number>(1.5);
  const [targetPct, setTargetPct] = useState<number>(3.0);
  const [trailingStopPct, setTrailingStopPct] = useState<number>(0.5);
  const [positionSizeValue, setPositionSizeValue] = useState<number>(100000);

  const [saving, setSaving] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);

  const [nlPrompt, setNlPrompt] = useState('');
  const [parsingNl, setParsingNl] = useState(false);
  const [automationMode, setAutomationMode] = useState<'signal_only' | 'one_tap' | 'fully_automated'>('signal_only');

  const handleParseNlPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlPrompt.trim()) return;
    setParsingNl(true);
    try {
      const res = await api.parseNaturalLanguageStrategy(nlPrompt);
      setName(res.name || name);
      setSymbol(res.symbol || symbol);
      setTimeframe(res.timeframe || timeframe);
      setLogicOperator(res.logic_operator || 'AND');
      if (res.entry_conditions?.length) setEntryConditions(res.entry_conditions);
      if (res.exit_conditions?.length) setExitConditions(res.exit_conditions);
      if (res.stop_loss_pct) setStopLossPct(res.stop_loss_pct);
      if (res.target_pct) setTargetPct(res.target_pct);
    } catch (e) {
      console.error(e);
    } finally {
      setParsingNl(false);
    }
  };

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(console.error);
  }, []);

  const handleSelectTemplate = (tpl: StrategyTemplate) => {
    setSelectedTemplateId(tpl.id);
    setName(tpl.name);
    setLogicOperator(tpl.default_rules.logic_operator || 'AND');
    setEntryConditions(tpl.default_rules.entry_conditions || []);
    setExitConditions(tpl.default_rules.exit_conditions || []);
    setStopLossPct(tpl.default_rules.stop_loss_pct || 1.5);
    setTargetPct(tpl.default_rules.target_pct || 3.0);
  };

  const addCondition = (type: 'entry' | 'exit') => {
    const newCond: IndicatorCondition = { indicator: 'RSI', params: { period: 14 }, operator: '<', value: 30 };
    if (type === 'entry') setEntryConditions([...entryConditions, newCond]);
    else setExitConditions([...exitConditions, newCond]);
  };

  const removeCondition = (type: 'entry' | 'exit', idx: number) => {
    if (type === 'entry') setEntryConditions(entryConditions.filter((_, i) => i !== idx));
    else setExitConditions(exitConditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (type: 'entry' | 'exit', idx: number, updated: IndicatorCondition) => {
    if (type === 'entry') {
      const copy = [...entryConditions];
      copy[idx] = updated;
      setEntryConditions(copy);
    } else {
      const copy = [...exitConditions];
      copy[idx] = updated;
      setExitConditions(copy);
    }
  };

  const handleSaveStrategy = async () => {
    setSaving(true);
    try {
      const payload: Partial<Strategy> = {
        name,
        template_id: selectedTemplateId || undefined,
        symbol,
        timeframe,
        segment,
        rules: {
          logic_operator: logicOperator,
          entry_conditions: entryConditions,
          exit_conditions: exitConditions,
          stop_loss_pct: stopLossPct,
          target_pct: targetPct,
          trailing_stop_pct: trailingStopPct,
          position_size_type: 'fixed_cash',
          position_size_value: positionSizeValue
        }
      };
      const created = await api.createStrategy(payload);
      setActiveStrategy(created);
      onStrategyCreated(created);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            No-Code Visual Strategy Builder
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Construct rule-based trading algorithms combining RSI, EMA, Supertrend, Bollinger Bands & VWAP indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveStrategy}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-xs border border-gray-700 transition-all"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>{saving ? 'Saving...' : 'Save Strategy'}</span>
          </button>

          {activeStrategy && (
            <button
              onClick={() => onRunBacktest(activeStrategy)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Backtest Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Natural Language AI Strategy Builder Card */}
      <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Natural Language AI Strategy Creator</h3>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            No Code Required
          </span>
        </div>
        <p className="text-xs text-gray-300">
          Describe your strategy in plain English (e.g., <em>"Alert me when 6-day SMA crosses above 30-day SMA on RELIANCE"</em> or <em>"RSI drops below 30 on NIFTY"</em>) and our Quant AI Engine will compile it into structured, pre-audited rules.
        </p>

        <form onSubmit={handleParseNlPrompt} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. Alert me when 6-day SMA crosses above 30-day SMA on RELIANCE with Stop Loss 1.5%"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500 font-sans"
          />
          <button
            type="submit"
            disabled={parsingNl || !nlPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{parsingNl ? 'Compiling Rules...' : 'Generate Strategy Rules'}</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
          <span className="font-semibold text-gray-300">Examples:</span>
          <button type="button" onClick={() => setNlPrompt("6-day SMA crosses above 30-day SMA on RELIANCE")} className="hover:text-cyan-400 underline decoration-dotted">SMA 6/30 Crossover</button>
          <span>•</span>
          <button type="button" onClick={() => setNlPrompt("RSI < 30 buy signal on HDFCBANK with target 3%")} className="hover:text-cyan-400 underline decoration-dotted">RSI Oversold Bounce</button>
          <span>•</span>
          <button type="button" onClick={() => setNlPrompt("Supertrend 10,3 bullish flip on NIFTY")} className="hover:text-cyan-400 underline decoration-dotted">Supertrend Trend Follow</button>
        </div>
      </div>

      {/* Pre-built Strategy Templates Carousel */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          Pre-Built Institutional Strategy Templates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`cursor-pointer p-4 rounded-xl transition-all border ${
                selectedTemplateId === tpl.id
                  ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {tpl.category}
                </span>
                {selectedTemplateId === tpl.id && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <h4 className="font-semibold text-sm text-white mt-2">{tpl.name}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Meta Setup & Automation Mode Selector */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="text-xs text-gray-400 font-medium">Strategy Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 font-medium">Execution Automation Tier</label>
          <select
            value={automationMode}
            onChange={(e: any) => setAutomationMode(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-semibold focus:border-cyan-500 outline-none"
          >
            <option value="signal_only">📡 Signal-Only (SEBI Compliant Default)</option>
            <option value="one_tap">⚡ One-Tap Confirm Mode</option>
            <option value="fully_automated">🤖 Fully Automated Execution (Gated)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">NSE Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
          >
            <option value="RELIANCE">RELIANCE (Reliance Ind.)</option>
            <option value="NIFTY50">NIFTY 50 Index</option>
            <option value="BANKNIFTY">BANKNIFTY Index</option>
            <option value="INFY">INFY (Infosys)</option>
            <option value="TATASTEEL">TATASTEEL</option>
            <option value="HDFCBANK">HDFCBANK</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
          >
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
          >
            <option value="EQUITY">Equity (Intraday MIS)</option>
            <option value="FUTURES">Futures</option>
            <option value="OPTIONS">Options</option>
          </select>
        </div>
      </div>

      {/* Entry Conditions Builder */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Entry Buy Conditions</h3>
            <select
              value={logicOperator}
              onChange={(e) => setLogicOperator(e.target.value as 'AND' | 'OR')}
              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-cyan-400 font-semibold"
            >
              <option value="AND">Match ALL (AND)</option>
              <option value="OR">Match ANY (OR)</option>
            </select>
          </div>
          <button
            onClick={() => addCondition('entry')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <Plus className="w-3.5 h-3.5" /> Add Condition
          </button>
        </div>

        <div className="space-y-3">
          {entryConditions.map((cond, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 bg-gray-900/80 p-3 rounded-xl border border-gray-800">
              <select
                value={cond.indicator}
                onChange={(e) => updateCondition('entry', idx, { ...cond, indicator: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="RSI">RSI (Relative Strength Index)</option>
                <option value="EMA_CROSSOVER">EMA Crossover</option>
                <option value="SUPERTREND">Supertrend</option>
                <option value="BOLLINGER">Bollinger Bands</option>
                <option value="VWAP">VWAP</option>
                <option value="MACD">MACD</option>
              </select>

              <select
                value={cond.operator}
                onChange={(e) => updateCondition('entry', idx, { ...cond, operator: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-cyan-400 font-mono"
              >
                <option value="<">is Less Than (&lt;)</option>
                <option value=">">is Greater Than (&gt;)</option>
                <option value="CROSSES_ABOVE">Crosses Above</option>
                <option value="CROSSES_BELOW">Crosses Below</option>
                <option value="CROSSES_BELOW_LOWER">Crosses Below Lower Band</option>
                <option value="EQUALS">Equals</option>
              </select>

              <input
                type="text"
                value={cond.value ?? ''}
                placeholder="Threshold Value (e.g. 30, GREEN)"
                onChange={(e) => updateCondition('entry', idx, { ...cond, value: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white w-40"
              />

              <button
                onClick={() => removeCondition('entry', idx)}
                className="text-gray-500 hover:text-rose-400 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Position Sizing & Risk Controls */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-400 font-medium">Stop Loss (%)</label>
          <input
            type="number"
            step="0.1"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(parseFloat(e.target.value))}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-semibold outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">Target Profit (%)</label>
          <input
            type="number"
            step="0.1"
            value={targetPct}
            onChange={(e) => setTargetPct(parseFloat(e.target.value))}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">Trailing Stop Loss (%)</label>
          <input
            type="number"
            step="0.1"
            value={trailingStopPct}
            onChange={(e) => setTrailingStopPct(parseFloat(e.target.value))}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-semibold outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium">Capital per Trade (INR)</label>
          <input
            type="number"
            step="10000"
            value={positionSizeValue}
            onChange={(e) => setPositionSizeValue(parseFloat(e.target.value))}
            className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
          />
        </div>
      </div>
    </div>
  );
};
