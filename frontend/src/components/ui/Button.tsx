import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white hover:shadow-glow hover:from-primary-600 hover:to-indigo-700 focus:ring-primary-500 border border-transparent',
      secondary: 'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500 border border-transparent',
      outline: 'border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500',
      danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] focus:ring-red-500 border border-transparent',
      ghost: 'bg-transparent hover:bg-gray-100/50 dark:hover:bg-slate-800/50 backdrop-blur-sm focus:ring-gray-500 border border-transparent',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
        {!loading && icon && <span className="me-2">{icon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
