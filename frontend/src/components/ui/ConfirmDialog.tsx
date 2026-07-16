import { AlertTriangle, Trash2, X } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  requireTyping?: string
  onTypingChange?: (value: string) => void
  typingValue?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  requireTyping,
  onTypingChange,
  typingValue = ''
}: ConfirmDialogProps) {
  const colors = {
    danger: {
      icon: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const color = colors[type]
  const canConfirm = !requireTyping || typingValue === requireTyping

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-4 rounded-lg ${color.bg} border ${color.border}`}>
          {type === 'danger' ? (
            <Trash2 className={`w-6 h-6 ${color.icon}`} />
          ) : (
            <AlertTriangle className={`w-6 h-6 ${color.icon}`} />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="px-2">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {message}
          </p>
        </div>

        {requireTyping && onTypingChange && (
          <div className="px-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type "<strong>{requireTyping}</strong>" to confirm:
            </label>
            <input
              type="text"
              value={typingValue}
              onChange={(e) => onTypingChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder={requireTyping}
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`${color.button} text-white`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
