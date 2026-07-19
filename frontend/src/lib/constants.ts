/**
 * Application constants
 * Centralized configuration values to avoid magic numbers
 */

// UI Timing Constants
export const UI_TIMING = {
  COPY_FEEDBACK_DURATION: 2000, // Duration to show "Copied!" message (ms)
  DEMO_MODE_NETWORK_DELAY: 300, // Simulated network delay in demo mode (ms)
} as const

// QR Code Configuration
export const QR_CONFIG = {
  WIDTH: 400,
  MARGIN: 2,
  ERROR_CORRECTION_LEVEL: 'M' as const,
} as const

// Notification Durations
export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 2000,
} as const

// Cache Keys
export const CACHE_KEYS = {
  CUSTOMER_WALLET: 'customer-wallet-data',
  BUSINESS_INFO: 'business-info',
  LOYALTY_PROGRAMS: 'loyalty-programs',
} as const

// App Limits
export const LIMITS = {
  MAX_REDEMPTION_HISTORY: 10,
  MAX_CAMPAIGN_DISPLAY: 10,
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
} as const
