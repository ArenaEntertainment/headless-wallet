import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, EyeOff, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const SecurityPage: React.FC = () => {
  const [securityScore, setSecurityScore] = useState(85)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [securityEvents, setSecurityEvents] = useState([
    {
      id: '1',
      type: 'info',
      message: 'Production environment detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      severity: 'low'
    },
    {
      id: '2',
      type: 'warning',
      message: 'Security headers validation passed',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      severity: 'medium'
    },
    {
      id: '3',
      type: 'success',
      message: 'All security checks passed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      severity: 'low'
    }
  ])

  const securityFeatures = [
    {
      name: 'Environment Detection',
      description: 'Automatically detects production environments and applies appropriate restrictions',
      status: 'enabled',
      importance: 'critical'
    },
    {
      name: 'Host Validation',
      description: 'Validates allowed hosts to prevent unauthorised usage',
      status: 'enabled',
      importance: 'high'
    },
    {
      name: 'Threat Pattern Detection',
      description: 'Monitors for common attack patterns and suspicious activity',
      status: 'enabled',
      importance: 'high'
    },
    {
      name: 'Secure Logging',
      description: 'Sanitises sensitive data in logs and error messages',
      status: 'enabled',
      importance: 'medium'
    },
    {
      name: 'Rate Limiting',
      description: 'Prevents abuse through request rate limiting',
      status: 'enabled',
      importance: 'medium'
    },
    {
      name: 'Security Headers',
      description: 'Validates and enforces security headers',
      status: 'enabled',
      importance: 'low'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled':
        return <CheckCircle className="h-4 w-4 text-success-500" />
      case 'disabled':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-error-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'text-error-600 dark:text-error-400'
      case 'high':
        return 'text-warning-600 dark:text-warning-400'
      case 'medium':
        return 'text-blue-600 dark:text-blue-400'
      case 'low':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-error-500" />
      default:
        return <Shield className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Security Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage security features and threats
        </p>
      </div>

      {/* Security Score */}
      <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Security Score
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary-600">{securityScore}%</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all duration-500',
                        securityScore >= 80 ? 'bg-success-500' :
                        securityScore >= 60 ? 'bg-warning-500' :
                        'bg-error-500'
                      )}
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {securityScore >= 80 ? 'Excellent security posture' :
                     securityScore >= 60 ? 'Good security, room for improvement' :
                     'Security needs attention'}
                  </p>
                </div>
              </div>
            </div>
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Security Features
        </h2>

        <div className="grid gap-4">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="card">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(feature.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </h3>
                        <span className={clsx(
                          'badge text-xs',
                          feature.importance === 'critical' ? 'badge-error' :
                          feature.importance === 'high' ? 'badge-warning' :
                          feature.importance === 'medium' ? 'badge-primary' :
                          'badge-gray'
                        )}>
                          {feature.importance}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-sm font-medium',
                      feature.status === 'enabled' ? 'text-success-600 dark:text-success-400' :
                      feature.status === 'disabled' ? 'text-warning-600 dark:text-warning-400' :
                      'text-error-600 dark:text-error-400'
                    )}>
                      {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                    </span>

                    <button className="btn-ghost btn-sm">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Events */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Security Events
          </h2>
          <button className="btn-secondary btn-sm">
            View All Events
          </button>
        </div>

        <div className="space-y-3">
          {securityEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {event.message}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                  <span className={clsx(
                    'badge text-xs',
                    event.severity === 'high' ? 'badge-error' :
                    event.severity === 'medium' ? 'badge-warning' :
                    'badge-gray'
                  )}>
                    {event.severity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Environment Information
          </h2>
        </div>
        <div className="card-content space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Environment
              </label>
              <span className="badge-primary">Development</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Host
              </label>
              <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                localhost:3000
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Security Level
              </label>
              <span className="badge-success">Development</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Warnings
              </label>
              <span className="badge-warning">Enabled</span>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Development Mode Active
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This wallet is running in development mode with relaxed security settings.
                  In production, strict security policies would be enforced automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive Data Demo */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Data Protection Demo
            </h2>
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="btn-secondary btn-sm inline-flex items-center gap-2"
            >
              {showSensitiveData ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-content">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This demonstrates how sensitive data is protected and sanitised in logs and error messages.
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Example Private Key:
            </h4>
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {showSensitiveData
                ? '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                : '0x****...****'
              }
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityPage