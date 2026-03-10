
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 bg-red-900/20 border border-red-800 rounded-3xl text-center animate-fadeIn">
          <h2 className="text-2xl font-black text-red-500 uppercase mb-4">Module Critical Failure</h2>
          <p className="text-gray-400 text-sm mb-6">The neural engine encountered an unrecoverable state in this module.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all uppercase tracking-widest text-[10px]"
          >
            Attempt Re-initialization
          </button>
          {this.state.error && (
            <pre className="mt-8 p-4 bg-black/40 rounded-xl text-left text-[10px] text-red-400/70 overflow-x-auto font-mono">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
