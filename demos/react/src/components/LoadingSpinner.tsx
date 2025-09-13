import React from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={clsx('flex items-center gap-2', className)} role="status" aria-label={label}>
      <div
        className={clsx('spinner', sizeClasses[size])}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  label?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  className,
  label = 'Loading...'
}) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner label={label} />
        </div>
      )}
    </div>
  )
}