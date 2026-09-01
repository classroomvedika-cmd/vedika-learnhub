import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to load data. Please check your connection and try again.',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/70 border border-rose-200 rounded-3xl my-4 shadow-sm">
      <div className="w-13 h-13 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mb-3.5 text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl border border-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      )}
    </div>
  );
};
