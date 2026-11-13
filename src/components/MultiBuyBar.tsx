import React from 'react';
import { MultiBuyAmount } from '../types/game';

interface MultiBuyBarProps {
  value: MultiBuyAmount;
  onChange: (val: MultiBuyAmount) => void;
  compact?: boolean;
}

const OPTIONS: { label: string; value: MultiBuyAmount }[] = [
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
  { label: '25x', value: 25 },
  { label: 'MAX', value: -1 }
];

export const MultiBuyBar: React.FC<MultiBuyBarProps> = ({ value, onChange, compact = false }) => {
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-0.5 ${
        compact ? 'gap-0.5' : 'gap-1'
      }`}
      role="group"
      aria-label="Multi-buy multiplier"
    >
      <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">
        Buy
      </span>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono tabular-nums transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              active
                ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
