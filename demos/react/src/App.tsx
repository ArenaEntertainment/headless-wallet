import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'))
const AccountsPage = React.lazy(() => import('./pages/AccountsPage'))
const ChainsPage = React.lazy(() => import('./pages/ChainsPage'))
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage'))
const SecurityPage = React.lazy(() => import('./pages/SecurityPage'))
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'))
const PlaygroundPage = React.lazy(() => import('./pages/PlaygroundPage'))

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/chains" element={<ChainsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  )
}

export default App