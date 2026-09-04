import React, { useState, useEffect } from 'react';
import { UserSettings, NewsSensitivity, AttentionPreference, DataMode } from '../types/index.js';
import { 
  X, 
  Sliders, 
  Check, 
  RotateCcw, 
  SlidersHorizontal, 
  ShieldCheck, 
  HelpCircle,
  Database,
  Radio
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(form);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setForm({
      priceThreshold: 2.0,
      volumeThreshold: 1.5,
      newsSensitivity: 'medium',
      attentionPreference: 'balanced',
      dataMode: 'demo',
      autoSnapshotOnVisit: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Engine Personalization & Thresholds
              </h2>
              <p className="text-xs text-slate-500">
                Configure when movements trigger Watch, Important, or High Attention flags.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Price Movement Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <label>Price Movement Threshold</label>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ±{form.priceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={form.priceThreshold}
              onChange={e => setForm({ ...form, priceThreshold: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Stocks moving greater than ±{form.priceThreshold}% since your last check receive elevated score weights.
            </p>
          </div>

          {/* 2. Volume Abnormality Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <label>Volume Surge Multiplier</label>
              <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {form.volumeThreshold}× 20-Day Avg
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.1"
              value={form.volumeThreshold}
              onChange={e => setForm({ ...form, volumeThreshold: parseFloat(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Triggers when trading activity exceeds {form.volumeThreshold}× its historical 20-day average.
            </p>
          </div>

          {/* 3. News Sensitivity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">News & Filing Sensitivity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as NewsSensitivity[]).map(level => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setForm({ ...form, newsSensitivity: level })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    form.newsSensitivity === level
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Attention Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">Attention Preference Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'conservative', label: 'Conservative', desc: 'Fewer, high-conviction alerts' },
                  { id: 'balanced', label: 'Balanced', desc: 'Standard heuristic scoring' },
                  { id: 'sensitive', label: 'Sensitive', desc: 'Early warning indicators' },
                ] as const
              ).map(pref => (
                <button
                  type="button"
                  key={pref.id}
                  onClick={() => setForm({ ...form, attentionPreference: pref.id })}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    form.attentionPreference === pref.id
                      ? 'bg-emerald-50/60 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{pref.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">{pref.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Data Feed Mode (Demo vs Live) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-600" />
                <span>Market Data Provider Mode</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {form.dataMode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, dataMode: 'demo' })}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left border ${
                  form.dataMode === 'demo'
                    ? 'bg-white border-emerald-500 text-emerald-950 shadow-xs'
                    : 'bg-transparent border-slate-200 text-slate-600'
                }`}
              >
                <span>Demo Simulation Mode</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Allows deterministic market shifts & judge walkthrough
                </span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, dataMode: 'live' })}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left border ${
                  form.dataMode === 'live'
                    ? 'bg-white border-emerald-500 text-emerald-950 shadow-xs'
                    : 'bg-transparent border-slate-200 text-slate-600'
                }`}
              >
                <span>Dual-Feed Live Mode</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Cross-feed arbitration & anomaly detection
                </span>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : null}
                <span>{savedSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
