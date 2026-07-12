// All Arab Countries Currencies
export const ARAB_CURRENCIES = [
  // Gulf Cooperation Council (GCC)
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', country: 'Saudi Arabia', nameAr: 'ريال سعودي' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates', nameAr: 'درهم إماراتي' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait', nameAr: 'دينار كويتي' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', country: 'Oman', nameAr: 'ريال عماني' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', country: 'Qatar', nameAr: 'ريال قطري' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', country: 'Bahrain', nameAr: 'دينار بحريني' },
  
  // Levant
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', country: 'Jordan', nameAr: 'دينار أردني' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', country: 'Lebanon', nameAr: 'ليرة لبنانية' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س', country: 'Syria', nameAr: 'ليرة سورية' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', country: 'Palestine', nameAr: 'شيكل' },
  
  // North Africa
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', country: 'Egypt', nameAr: 'جنيه مصري' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', country: 'Libya', nameAr: 'دينار ليبي' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia', nameAr: 'دينار تونسي' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria', nameAr: 'دينار جزائري' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م', country: 'Morocco', nameAr: 'درهم مغربي' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'أ.م', country: 'Mauritania', nameAr: 'أوقية موريتانية' },
  
  // Horn of Africa & East
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س', country: 'Sudan', nameAr: 'جنيه سوداني' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh.So', country: 'Somalia', nameAr: 'شلن صومالي' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', country: 'Djibouti', nameAr: 'فرنك جيبوتي' },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'CF', country: 'Comoros', nameAr: 'فرنك قمري' },
  
  // Iraq & Yemen
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', country: 'Iraq', nameAr: 'دينار عراقي' },
  { code: 'YER', name: 'Yemeni Rial', symbol: 'ر.ي', country: 'Yemen', nameAr: 'ريال يمني' },
  
  // Common International
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States', nameAr: 'دولار أمريكي' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', nameAr: 'يورو' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', nameAr: 'جنيه إسترليني' },
]

export const getCurrencySymbol = (code: string): string => {
  const currency = ARAB_CURRENCIES.find(c => c.code === code)
  return currency?.symbol || code
}

export const getCurrencyName = (code: string, isArabic: boolean = false): string => {
  const currency = ARAB_CURRENCIES.find(c => c.code === code)
  if (!currency) return code
  return isArabic ? currency.nameAr : currency.name
}

export const formatCurrency = (amount: number, currencyCode: string, isArabic: boolean = false): string => {
  const symbol = getCurrencySymbol(currencyCode)
  const formatted = amount.toLocaleString(isArabic ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  // In Arabic, symbol comes after number
  return isArabic ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}
