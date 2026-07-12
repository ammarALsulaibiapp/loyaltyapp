import { clsx } from 'clsx'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export default function Toggle({ enabled, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          enabled ? 'bg-green-600 focus:ring-green-500' : 'bg-red-600 focus:ring-red-500',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}
