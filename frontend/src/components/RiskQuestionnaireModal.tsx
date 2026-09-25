import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface RiskQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
}

export const RiskQuestionnaireModal: React.FC<RiskQuestionnaireModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [tolerance, setTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>(user?.risk_profile?.tolerance || 'moderate');
  const [maxDrawdown, setMaxDrawdown] = useState<number>(user?.risk_profile?.max_drawdown_limit || 15);
  const [horizon, setHorizon] = useState<string>(user?.risk_profile?.investment_horizon || 'medium');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateRiskProfile({
        tolerance,
        max_drawdown_limit: maxDrawdown,
        investment_horizon: horizon
      });
      onUpdateUser(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel-glow w-full max-w-lg p-6 rounded-2xl space-y-6 relative border border-cyan-500/30">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Investor Risk Assessment Questionnaire</h3>
            <p className="text-xs text-gray-400">Used by AlgoTred Quantitative Risk Engine to calibrate maximum drawdown limits and strategy sizing.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Stated Risk Tolerance</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {(['conservative', 'moderate', 'aggressive'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTolerance(t)}
                  className={`py-2 rounded-xl text-xs capitalize font-semibold transition-all border ${
                    tolerance === t ? 'border-cyan-500 bg-cyan-950/60 text-cyan-400' : 'border-gray-800 bg-gray-900 text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Maximum Acceptable Peak Drawdown Limit (%)</label>
            <input
              type="number"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
              className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-bold outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Target Investment Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="short">Short Term (Intraday / Scalping)</option>
              <option value="medium">Medium Term (Swing / Positional)</option>
              <option value="long">Long Term (Systematic Allocation)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
        >
          {saving ? 'Saving...' : 'Update Risk Assessment Profile'}
        </button>
      </div>
    </div>
  );
};
