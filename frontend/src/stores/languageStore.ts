import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n'

interface LanguageState {
  language: 'en' | 'ar'
  direction: 'ltr' | 'rtl'
  setLanguage: (language: 'en' | 'ar') => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      direction: 'ltr',
      
      setLanguage: (language: 'en' | 'ar') => {
        i18n.changeLanguage(language)
        const direction = language === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.setAttribute('dir', direction)
        document.documentElement.setAttribute('lang', language)
        set({ language, direction })
      },
      
      toggleLanguage: () => {
        const newLanguage = get().language === 'en' ? 'ar' : 'en'
        get().setLanguage(newLanguage)
      },
    }),
    {
      name: 'language-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore dir/lang attributes on HTML element after rehydration
          const direction = state.language === 'ar' ? 'rtl' : 'ltr'
          document.documentElement.setAttribute('dir', direction)
          document.documentElement.setAttribute('lang', state.language)
          i18n.changeLanguage(state.language)
        }
      },
    }
  )
)
