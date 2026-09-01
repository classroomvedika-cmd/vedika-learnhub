import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'profile' | 'exam' | 'chat';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === 'profile') {
    return (
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 bg-slate-200 rounded-md w-3/4" />
            <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            <div className="h-4 bg-slate-100 rounded-md w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'exam') {
    return (
      <div className="space-y-4">
        {items.map((_, i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-100 rounded-full w-20" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-4/5 mb-4" />
            <div className="flex gap-4 pt-3 border-t border-slate-100">
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="space-y-3 p-4">
        {items.map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'} animate-pulse`}>
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className={`space-y-1.5 max-w-[75%] ${i % 2 === 0 ? '' : 'items-end'}`}>
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-12 bg-slate-100 rounded-2xl w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FullPageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading Vedika LearnHub...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3157D5] to-[#6C63D9] flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 tracking-wide">{message}</p>
    </div>
  );
};
