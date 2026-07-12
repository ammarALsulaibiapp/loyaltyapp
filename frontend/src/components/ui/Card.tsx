import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  headerAction?: React.ReactNode
}

export default function Card({
  title,
  subtitle,
  headerAction,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'glass-panel dark:glass-panel-dark rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
