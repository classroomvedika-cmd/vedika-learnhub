import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-[#101726]/60 border border-rose-900/30 rounded-3xl m-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            {this.props.fallbackTitle || 'Something went wrong in this section'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            A temporary issue occurred while rendering. You can tap below to recover.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-600/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
