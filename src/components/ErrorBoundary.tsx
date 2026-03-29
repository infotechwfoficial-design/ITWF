import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <div className="size-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
            <AlertCircle size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
            Oops! Algo deu errado.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
            Não conseguimos carregar esta parte do aplicativo. Isso pode acontecer após uma atualização de sistema.
          </p>

          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            Recarregar Aplicativo
          </button>
          
          {error && (
            <p className="mt-8 text-[10px] text-slate-400 font-mono opacity-50 px-4 line-clamp-2">
              Error: {error.message}
            </p>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
