import React from 'react';
import { Loader2 } from 'lucide-react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  loading = false,
  label,
  description,
  size = 'md',
}) => {
  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 'w-9 h-5' : 'w-11 h-6';
  const thumbSize = isSmall ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const translateDistance = isSmall ? 'translate-x-4' : 'translate-x-5';

  const toggle = () => {
    if (disabled || loading) return;
    onChange(!checked);
  };

  return (
    <div
      id={id ? `switch-row-${id}` : undefined}
      onClick={toggle}
      className={`flex items-center justify-between gap-3 select-none py-1 transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:opacity-90'
      }`}
    >
      {(label || description) && (
        <div className="flex flex-col flex-1 pr-2">
          {label && <span className="text-xs font-semibold text-slate-800 leading-snug">{label}</span>}
          {description && <span className="text-[11px] text-slate-500 leading-tight mt-0.5">{description}</span>}
        </div>
      )}

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle switch'}
        disabled={disabled || loading}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={`relative inline-flex shrink-0 ${trackWidth} items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
          checked ? 'bg-[#3157D5]' : 'bg-slate-200 border border-slate-300'
        } ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block ${thumbSize} transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            checked ? translateDistance : 'translate-x-0.5'
          }`}
        >
          {loading && (
            <Loader2 className="w-2.5 h-2.5 text-[#3157D5] animate-spin" />
          )}
        </span>
      </button>
    </div>
  );
};
