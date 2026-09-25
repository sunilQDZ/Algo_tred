import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2, ShieldCheck, Key, Lock, ArrowUpRight } from 'lucide-react';
import { BrokerConnection } from '../types';
import { api } from '../api';

export const BrokerManager: React.FC = () => {
  const [brokers, setBrokers] = useState<BrokerConnection[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<'ZERODHA' | 'DHAN' | 'PAPER'>('ZERODHA');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getBrokers().then(setBrokers).catch(console.error);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const conn = await api.connectBroker(selectedBroker, apiKey, apiSecret, accessToken, clientId);
      setBrokers([...brokers.filter(b => b.broker_name !== selectedBroker), conn]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-cyan-400" />
          Indian Stock Broker Account Integration
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Securely link Zerodha Kite Connect or Dhan API credentials via OAuth2 / API keys. Tokens are encrypted at rest with AES-256.
        </p>
      </div>

      {/* Broker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Zerodha Kite */}
        <div
          onClick={() => setSelectedBroker('ZERODHA')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedBroker === 'ZERODHA'
              ? 'border-orange-500 bg-orange-950/20 shadow-lg shadow-orange-500/10'
              : 'border-gray-800 bg-gray-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-white">Zerodha Kite Connect</span>
            {brokers.some(b => b.broker_name === 'ZERODHA' && b.status === 'CONNECTED') && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Connect via official Zerodha Kite API Key & Access Token.</p>
        </div>

        {/* Dhan API */}
        <div
          onClick={() => setSelectedBroker('DHAN')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedBroker === 'DHAN'
              ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
              : 'border-gray-800 bg-gray-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-white">Dhan HQ API</span>
            {brokers.some(b => b.broker_name === 'DHAN' && b.status === 'CONNECTED') && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Direct integration via Dhan Access Token & Client ID.</p>
        </div>

        {/* Paper Simulator */}
        <div
          onClick={() => setSelectedBroker('PAPER')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedBroker === 'PAPER'
              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
              : 'border-gray-800 bg-gray-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-white">Paper Trading Simulator</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Zero-risk virtual trading sandbox with live NSE price stream.</p>
        </div>
      </div>

      {/* Connection Form */}
      {selectedBroker !== 'PAPER' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Configure {selectedBroker} API Credentials
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-medium">Client ID / App Key</label>
              <input
                type="text"
                value={clientId || apiKey}
                onChange={(e) => { setClientId(e.target.value); setApiKey(e.target.value); }}
                placeholder="e.g. AB1234 or kite_api_key"
                className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Access Token / API Secret</label>
              <input
                type="password"
                value={accessToken || apiSecret}
                onChange={(e) => { setAccessToken(e.target.value); setApiSecret(e.target.value); }}
                placeholder="Secret key or OAuth token"
                className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            {loading ? 'Authenticating...' : `Save & Link ${selectedBroker} Account`}
          </button>
        </div>
      )}
    </div>
  );
};
