import React, { useState } from 'react';
import { Radio, Copy, Check, Terminal, Code, ShieldCheck } from 'lucide-react';

export const TradingViewWebhooks: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const sampleDeploymentId = "dep_live_99812";
  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/v1/webhooks/tradingview/${sampleDeploymentId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleJsonPayload = `{
  "action": "BUY",
  "symbol": "RELIANCE",
  "qty": 50,
  "order_type": "MARKET"
}`;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          TradingView Automated Webhook Signal Execution
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Automate order placement on Zerodha / Dhan directly from your custom TradingView indicator alert webhooks.
        </p>
      </div>

      {/* Webhook URL Box */}
      <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
        <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">Your Live Webhook Endpoint URL</span>

        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 p-3 rounded-xl">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full bg-transparent text-xs text-white font-mono outline-none"
          />
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* TradingView Alert Setup Payload Guide */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          TradingView Alert Message JSON Format
        </h3>

        <p className="text-xs text-gray-400">
          Paste the following JSON payload into the <strong>Message</strong> box when creating an alert in TradingView:
        </p>

        <pre className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
          {sampleJsonPayload}
        </pre>
      </div>
    </div>
  );
};
