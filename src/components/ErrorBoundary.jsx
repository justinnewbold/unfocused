import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

/**
 * Root error boundary that catches unhandled errors and shows a recovery UI.
 * Prevents the entire app from crashing with a white screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log to console for debugging
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Reset to conversation view
    window.location.hash = ''
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-dark text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>

            {/* Message */}
            <div>
              <h1 className="text-xl font-display font-semibold mb-2">
                Something went sideways
              </h1>
              <p className="text-white/60 text-sm leading-relaxed">
                Don't worry — your data is safe in localStorage. This is just a
                temporary glitch. Take a breath, and let's try again.
              </p>
            </div>

            {/* Error details (collapsible) */}
            {this.state.error && (
              <details className="text-left bg-white/5 rounded-xl p-4 text-xs">
                <summary className="cursor-pointer text-white/50 flex items-center gap-2">
                  <Bug className="w-3 h-3" />
                  Technical details
                </summary>
                <pre className="mt-3 text-red-300/70 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-nero-500 hover:bg-nero-400 text-white font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Start Fresh
              </button>
            </div>

            {/* Reassurance */}
            <p className="text-white/30 text-xs">
              If this keeps happening, try clearing your browser cache.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lighter-weight error boundary for individual view sections.
 * Shows an inline error message instead of replacing the whole page.
 */
export class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ViewErrorBoundary:${this.props.viewName || 'unknown'}]`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <div className="w-12 h-12 mb-4 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-white/70 text-sm mb-1">
            This section hit a snag
          </p>
          <p className="text-white/40 text-xs mb-4">
            {this.props.viewName ? `${this.props.viewName} encountered an error` : 'Something went wrong'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-sm transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
