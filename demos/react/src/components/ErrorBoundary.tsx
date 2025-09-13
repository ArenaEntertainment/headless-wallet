import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="card max-w-lg w-full">
            <div className="card-content text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-error-500" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                An unexpected error occurred in the application. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-mono text-sm font-medium text-error-600 dark:text-error-400 mb-2">
                    Error Details:
                  </h3>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <h4 className="font-mono text-sm font-medium text-error-600 dark:text-error-400 mt-4 mb-2">
                        Component Stack:
                      </h4>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}