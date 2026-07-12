import { isDemoMode } from '../lib/mockData'
import { AlertCircle } from 'lucide-react'

export default function DemoBanner() {
  if (!isDemoMode()) return null

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
        <AlertCircle className="w-4 h-4" />
        <span className="font-medium">DEMO MODE:</span>
        <span>Using mock data. Connect Supabase to use real database.</span>
      </div>
    </div>
  )
}
