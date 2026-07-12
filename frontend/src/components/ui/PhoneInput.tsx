import { useState } from 'react'
import { ARAB_PHONE_CODES, formatPhoneNumber, validatePhoneNumber } from '../../lib/phoneNumbers'
import { useLanguageStore } from '../../stores/languageStore'

interface PhoneInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  helperText?: string
  error?: string
}

export default function PhoneInput({
  label,
  value,
  onChange,
  required = false,
  helperText,
  error
}: PhoneInputProps) {
  const { language } = useLanguageStore()
  const isArabic = language === 'ar'
  
  // Parse existing value to get country code and number
  const getInitialCountryCode = () => {
    if (value.startsWith('+')) {
      const match = ARAB_PHONE_CODES.find(c => value.startsWith(c.code))
      return match?.code || '+968'
    }
    return '+968' // Default to Oman
  }
  
  const [countryCode, setCountryCode] = useState(getInitialCountryCode())
  const [phoneNumber, setPhoneNumber] = useState(
    value.replace(countryCode, '').replace(/\D/g, '').replace(/^0+/, '')
  )
  
  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode)
    updateFullNumber(newCode, phoneNumber)
  }
  
  const handlePhoneChange = (newPhone: string) => {
    // Remove all non-numeric except leading 0
    const cleaned = newPhone.replace(/[^\d]/g, '')
    setPhoneNumber(cleaned)
    updateFullNumber(countryCode, cleaned)
  }
  
  const updateFullNumber = (code: string, phone: string) => {
    if (!phone) {
      onChange('')
      return
    }
    const formatted = formatPhoneNumber(phone, code)
    onChange(formatted)
  }
  
  const validation = phoneNumber ? validatePhoneNumber(phoneNumber, countryCode) : null
  const country = ARAB_PHONE_CODES.find(c => c.code === countryCode)
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-32 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          dir="ltr"
        >
          <optgroup label={isArabic ? 'دول الخليج' : 'GCC'}>
            {ARAB_PHONE_CODES.filter(c => ['🇸🇦', '🇦🇪', '🇰🇼', '🇴🇲', '🇶🇦', '🇧🇭'].includes(c.flag)).map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
          <optgroup label={isArabic ? 'شمال أفريقيا' : 'North Africa'}>
            {ARAB_PHONE_CODES.filter(c => ['🇪🇬', '🇱🇾', '🇹🇳', '🇩🇿', '🇲🇦', '🇲🇷'].includes(c.flag)).map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
          <optgroup label={isArabic ? 'بلاد الشام' : 'Levant'}>
            {ARAB_PHONE_CODES.filter(c => ['🇯🇴', '🇱🇧', '🇸🇾', '🇵🇸'].includes(c.flag)).map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
          <optgroup label={isArabic ? 'العراق واليمن' : 'Iraq & Yemen'}>
            {ARAB_PHONE_CODES.filter(c => ['🇮🇶', '🇾🇪'].includes(c.flag)).map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
          <optgroup label={isArabic ? 'شرق أفريقيا' : 'East Africa'}>
            {ARAB_PHONE_CODES.filter(c => ['🇸🇩', '🇸🇴', '🇩🇯', '🇰🇲'].includes(c.flag)).map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
        </select>
        
        {/* Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={country?.example || '501234567'}
            required={required}
            dir="ltr"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              error || (validation && !validation.valid)
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
      </div>
      
      {/* Helper Text or Error */}
      {helperText && !error && !validation && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      
      {/* Validation Message */}
      {validation && !validation.valid && (
        <p className="text-xs text-red-500">{validation.message}</p>
      )}
      
      {/* Custom Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      
      {/* Example Format */}
      {country && !validation && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isArabic ? 'مثال' : 'Example'}: {country.code} {country.example}
        </p>
      )}
    </div>
  )
}
