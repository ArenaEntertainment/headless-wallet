import React, { useState, useEffect } from 'react'
import { Activity, Zap, Timer, BarChart3, TrendingUp, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'error'
  description: string
}

const PerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      name: 'Connection Time',
      value: 125,
      unit: 'ms',
      status: 'good',
      description: 'Time taken to establish wallet connection'
    },
    {
      name: 'Transaction Signing',
      value: 89,
      unit: 'ms',
      status: 'good',
      description: 'Average time to sign transactions'
    },
    {
      name: 'Chain Switching',
      value: 245,
      unit: 'ms',
      status: 'warning',
      description: 'Time to switch between chains'
    },
    {
      name: 'Account Creation',
      value: 67,
      unit: 'ms',
      status: 'good',
      description: 'Time to create new accounts'
    },
    {
      name: 'Memory Usage',
      value: 12.4,
      unit: 'MB',
      status: 'good',
      description: 'Current memory consumption'
    },
    {
      name: 'Bundle Size',
      value: 156,
      unit: 'KB',
      status: 'good',
      description: 'JavaScript bundle size impact'
    }
  ])

  const [isMonitoring, setIsMonitoring] = useState(true)
  const [realtimeData, setRealtimeData] = useState([
    { time: '00:00', value: 85 },
    { time: '00:05', value: 92 },
    { time: '00:10', value: 78 },
    { time: '00:15', value: 95 },
    { time: '00:20', value: 88 },
  ])

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setMetrics(prevMetrics =>
        prevMetrics.map(metric => ({
          ...metric,
          value: metric.value + (Math.random() - 0.5) * (metric.value * 0.1)
        }))
      )

      setRealtimeData(prevData => {
        const newData = [...prevData.slice(1)]
        const now = new Date()
        const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        newData.push({
          time: timeStr,
          value: 70 + Math.random() * 50
        })
        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success-600 dark:text-success-400'
      case 'warning':
        return 'text-warning-600 dark:text-warning-400'
      case 'error':
        return 'text-error-600 dark:text-error-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return 'badge-success'
      case 'warning':
        return 'badge-warning'
      case 'error':
        return 'badge-error'
      default:
        return 'badge-gray'
    }
  }

  const getOverallScore = () => {
    const goodCount = metrics.filter(m => m.status === 'good').length
    const warningCount = metrics.filter(m => m.status === 'warning').length
    const errorCount = metrics.filter(m => m.status === 'error').length

    if (errorCount > 0) return { score: 'Poor', color: 'text-error-600' }
    if (warningCount > goodCount) return { score: 'Fair', color: 'text-warning-600' }
    if (warningCount > 0) return { score: 'Good', color: 'text-success-600' }
    return { score: 'Excellent', color: 'text-success-600' }
  }

  const overallScore = getOverallScore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Performance Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time performance metrics and optimisation insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={clsx(
            'h-2 w-2 rounded-full',
            isMonitoring ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
          )} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isMonitoring ? 'Monitoring' : 'Paused'}
          </span>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="btn-secondary btn-sm ml-2"
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Overall Performance
              </h2>
              <div className="flex items-center gap-2">
                <span className={clsx('text-2xl font-bold', overallScore.color)}>
                  {overallScore.score}
                </span>
                <TrendingUp className="h-5 w-5 text-success-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based on current performance metrics
              </p>
            </div>
            <Activity className="h-12 w-12 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {metric.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {metric.description}
                  </p>
                </div>
                <span className={clsx('badge text-xs', getStatusBadge(metric.status))}>
                  {metric.status}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className={clsx('text-2xl font-bold', getStatusColor(metric.status))}>
                  {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.unit}
                </span>
              </div>

              {/* Simple progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={clsx(
                    'h-1.5 rounded-full transition-all duration-300',
                    metric.status === 'good' ? 'bg-success-500' :
                    metric.status === 'warning' ? 'bg-warning-500' :
                    'bg-error-500'
                  )}
                  style={{
                    width: `${Math.min(100, (metric.value / (metric.unit === 'ms' ? 500 : metric.unit === 'MB' ? 50 : 200)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Performance Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Real-time Performance
            </h2>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last 5 minutes
              </span>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* Simple ASCII-style chart */}
          <div className="space-y-2">
            {realtimeData.map((point, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12">
                  {point.time}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${point.value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                  {Math.round(point.value)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Optimisation Recommendations
          </h2>
        </div>
        <div className="card-content space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Bundle Size Optimisation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consider code splitting and lazy loading for better initial load performance.
                Current bundle size is within acceptable limits.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Timer className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Connection Performance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Wallet connection times are excellent. Consider implementing connection caching
                for even better user experience.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Chain Switching Optimisation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chain switching could be faster. Consider preloading chain configurations
                and implementing background switching.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Performance Settings
          </h2>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Enable Performance Monitoring
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Collect real-time performance metrics
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMonitoring}
                  onChange={() => setIsMonitoring(!isMonitoring)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Sample Rate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Percentage of operations to monitor (10% recommended)
                </p>
              </div>
              <select className="input w-20">
                <option value="0.1">10%</option>
                <option value="0.2">20%</option>
                <option value="0.5">50%</option>
                <option value="1.0">100%</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Performance Alerts
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when performance degrades
                </p>
              </div>
              <button className="btn-secondary btn-sm">
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformancePage