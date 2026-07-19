import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { isDemoMode } from '../lib/mockData'
import { UI_TIMING } from '../lib/constants'

export function useDemoQuery<T>(
  options: UseQueryOptions<T> & { demoData?: T }
) {
  return useQuery({
    ...options,
    queryFn: async (context) => {
      if (isDemoMode() && options.demoData !== undefined) {
        // Return mock data in demo mode
        await new Promise(resolve => setTimeout(resolve, UI_TIMING.DEMO_MODE_NETWORK_DELAY)) // Simulate network delay
        return options.demoData
      }
      // Call real query function
      return (options.queryFn as any)(context)
    },
  })
}
