import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  SlidersHorizontal,
  X
} from 'lucide-react';

interface Props {
  onSimulateScenario: (scenario: string) => void;
  onResetMarket: () => void;
  onOpenChanges: () => void;
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
}

export const DemoWalkthroughBar: React.FC<Props> = ({
  onSimulateScenario,
  onResetMarket,
  onOpenChanges,
  onSelectStock,
  onOpenSettings,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all"
      >
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Judge Demo Guide</span>
      </button>
    );
  }

  const steps = [
    {
      step: 1,
      title: 'Baseline Snapshot',
      desc: 'Watchlist loaded with baseline NSE quotes (TCS, Reliance, HDFC, Infosys, ICICI).',
      actionLabel: 'Trigger Step 2: Simulate Volatility',
      action: () => {
        onSimulateScenario('tech_rally_reliance_dip');
        setCurrentStep(2);
      },
    },
    {
      step: 2,
      title: 'Simulate Market Shifts',
      desc: 'TCS rallies +2.4% (1.9× vol) on deal news. Reliance tumbles -3.2% (1.85× vol).',
      actionLabel: 'Inspect "What Changed"',
      action: () => {
        onOpenChanges();
        setCurrentStep(3);
      },
    },
    {
      step: 3,
      title: 'Evaluate Heuristics',
      desc: 'TCS and Reliance flagged as HIGH ATTENTION. Sub-threshold moves stay quiet.',
      actionLabel: 'Drill Down on RELIANCE',
      action: () => {
        onSelectStock('RELIANCE');
        setCurrentStep(4);
      },
    },
    {
      step: 4,
      title: 'Verify Grounded Explanation',
      desc: 'Engine explains: "Reliance fell 3.2% (>2% threshold) with 1.85× institutional volume."',
      actionLabel: 'Test Personalization (Settings)',
      action: () => {
        onOpenSettings();
        setCurrentStep(5);
      },
    },
    {
      step: 5,
      title: 'Dynamic Re-scoring',
      desc: 'Raise threshold to 4.0%: Reliance dynamically shifts down from HIGH ATTENTION to WATCH!',
      actionLabel: 'Reset Simulation',
      action: () => {
        onResetMarket();
        setCurrentStep(1);
      },
    },
  ];

  const active = steps[currentStep - 1] || steps[0];

  return (
    <aside aria-label="Demo flow walkthrough" className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 border border-slate-800 shadow-md relative">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-md"
        title="Minimize guide"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-3 h-3 text-emerald-400" />
              Groww 2026 Judge Walkthrough
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {active.title}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            {active.desc}
          </p>
        </div>

        {/* Step Progression Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={active.action}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>{active.actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              onResetMarket();
              setCurrentStep(1);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Pills */}
      <div className="grid grid-cols-5 gap-1.5 mt-3.5 pt-3 border-t border-slate-800/80">
        {steps.map(s => (
          <button
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`h-1.5 rounded-full transition-all ${
              s.step === currentStep
                ? 'bg-emerald-400'
                : s.step < currentStep
                  ? 'bg-emerald-700'
                  : 'bg-slate-700'
            }`}
            title={`Step ${s.step}: ${s.title}`}
          />
        ))}
      </div>
    </aside>
  );
};
