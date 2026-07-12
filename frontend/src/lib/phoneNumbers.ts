// Complete Phone Number Support for All Arab Countries

export const ARAB_PHONE_CODES = [
  // Gulf Cooperation Council (GCC)
  { country: 'Saudi Arabia', countryAr: 'السعودية', code: '+966', flag: '🇸🇦', length: 9, example: '501234567' },
  { country: 'United Arab Emirates', countryAr: 'الإمارات', code: '+971', flag: '🇦🇪', length: 9, example: '501234567' },
  { country: 'Kuwait', countryAr: 'الكويت', code: '+965', flag: '🇰🇼', length: 8, example: '50123456' },
  { country: 'Oman', countryAr: 'عمان', code: '+968', flag: '🇴🇲', length: 8, example: '91234567' },
  { country: 'Qatar', countryAr: 'قطر', code: '+974', flag: '🇶🇦', length: 8, example: '33123456' },
  { country: 'Bahrain', countryAr: 'البحرين', code: '+973', flag: '🇧🇭', length: 8, example: '36123456' },
  
  // Levant
  { country: 'Jordan', countryAr: 'الأردن', code: '+962', flag: '🇯🇴', length: 9, example: '790123456' },
  { country: 'Lebanon', countryAr: 'لبنان', code: '+961', flag: '🇱🇧', length: 8, example: '71123456' },
  { country: 'Syria', countryAr: 'سوريا', code: '+963', flag: '🇸🇾', length: 9, example: '911234567' },
  { country: 'Palestine', countryAr: 'فلسطين', code: '+970', flag: '🇵🇸', length: 9, example: '591234567' },
  
  // North Africa
  { country: 'Egypt', countryAr: 'مصر', code: '+20', flag: '🇪🇬', length: 10, example: '1001234567' },
  { country: 'Libya', countryAr: 'ليبيا', code: '+218', flag: '🇱🇾', length: 10, example: '9101234567' },
  { country: 'Tunisia', countryAr: 'تونس', code: '+216', flag: '🇹🇳', length: 8, example: '20123456' },
  { country: 'Algeria', countryAr: 'الجزائر', code: '+213', flag: '🇩🇿', length: 9, example: '551234567' },
  { country: 'Morocco', countryAr: 'المغرب', code: '+212', flag: '🇲🇦', length: 9, example: '612345678' },
  { country: 'Mauritania', countryAr: 'موريتانيا', code: '+222', flag: '🇲🇷', length: 8, example: '22123456' },
  
  // Horn of Africa & East
  { country: 'Sudan', countryAr: 'السودان', code: '+249', flag: '🇸🇩', length: 9, example: '911234567' },
  { country: 'Somalia', countryAr: 'الصومال', code: '+252', flag: '🇸🇴', length: 9, example: '612345678' },
  { country: 'Djibouti', countryAr: 'جيبوتي', code: '+253', flag: '🇩🇯', length: 8, example: '77123456' },
  { country: 'Comoros', countryAr: 'جزر القمر', code: '+269', flag: '🇰🇲', length: 7, example: '3212345' },
  
  // Iraq & Yemen
  { country: 'Iraq', countryAr: 'العراق', code: '+964', flag: '🇮🇶', length: 10, example: '7901234567' },
  { country: 'Yemen', countryAr: 'اليمن', code: '+967', flag: '🇾🇪', length: 9, example: '711234567' },
]

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If phone already starts with country code, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // If phone starts with 00, replace with +
  if (phone.startsWith('00')) {
    return '+' + cleaned.substring(2)
  }
  
  // If phone starts with 0, remove it
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned
  
  // Add country code
  return `${countryCode}${withoutLeadingZero}`
}

export const validatePhoneNumber = (phone: string, countryCode: string): { valid: boolean; message: string } => {
  const country = ARAB_PHONE_CODES.find(c => c.code === countryCode)
  if (!country) {
    return { valid: false, message: 'Invalid country code' }
  }
  
  // Clean phone number
  let cleaned = phone.replace(/\D/g, '')
  
  // Remove country code if present
  if (cleaned.startsWith(countryCode.replace('+', ''))) {
    cleaned = cleaned.substring(countryCode.replace('+', '').length)
  }
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Check length
  if (cleaned.length !== country.length) {
    return {
      valid: false,
      message: `Phone number should be ${country.length} digits (e.g., ${country.code} ${country.example})`
    }
  }
  
  return { valid: true, message: 'Valid phone number' }
}

export const getCountryFromCode = (code: string, isArabic: boolean = false): string => {
  const country = ARAB_PHONE_CODES.find(c => c.code === code)
  if (!country) return code
  return isArabic ? country.countryAr : country.country
}

export const parsePhoneNumber = (fullPhone: string): { countryCode: string; number: string } | null => {
  if (!fullPhone.startsWith('+')) {
    return null
  }
  
  // Try to match against known country codes
  for (const country of ARAB_PHONE_CODES) {
    if (fullPhone.startsWith(country.code)) {
      return {
        countryCode: country.code,
        number: fullPhone.substring(country.code.length)
      }
    }
  }
  
  return null
}

export const formatPhoneDisplay = (phone: string): string => {
  const parsed = parsePhoneNumber(phone)
  if (!parsed) return phone
  
  const country = ARAB_PHONE_CODES.find(c => c.code === parsed.countryCode)
  if (!country) return phone
  
  // Format nicely with spaces
  const { countryCode, number } = parsed
  
  // Add spaces for better readability
  if (number.length <= 4) {
    return `${countryCode} ${number}`
  } else if (number.length <= 7) {
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3)}`
  } else {
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
  }
}
