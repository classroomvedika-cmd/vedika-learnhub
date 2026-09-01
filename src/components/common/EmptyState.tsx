import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200/80 rounded-3xl my-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center mb-4 text-[#3157D5]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-gradient-to-r from-[#3157D5] to-[#6C63D9] hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
