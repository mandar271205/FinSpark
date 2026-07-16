import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900/50 rounded-2xl border border-red-500/20 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Something went wrong</h2>
          <p className="text-slate-400 text-sm max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-slate-700 font-medium"
          >
            <RefreshCcw size={16} /> Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
