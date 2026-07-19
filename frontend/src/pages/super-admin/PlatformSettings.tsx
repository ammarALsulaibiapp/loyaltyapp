import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ARAB_CURRENCIES } from '../../lib/currencies'

export default function PlatformSettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    platformName: 'LoyaltyPass',
    supportEmail: 'support@loyaltypass.com',
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    allowSignups: true,
    maintenanceMode: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save settings to database
    // await savePlatformSettings(settings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('platform.title', 'Platform Settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('platform.configure', 'Configure platform-wide settings')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title={t('platform.generalSettings', 'General Settings')}>
          <div className="space-y-4">
            <Input
              label={t('platform.platformName', 'Platform Name')}
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            />
            <Input
              label={t('platform.supportEmail', 'Support Email')}
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('platform.defaultCurrency', 'Default Currency')}
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <optgroup label="🇸🇦 GCC Countries">
                  <option value="SAR">🇸🇦 SAR - Saudi Riyal (ر.س)</option>
                  <option value="AED">🇦🇪 AED - UAE Dirham (د.إ)</option>
                  <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar (د.ك)</option>
                  <option value="OMR">🇴🇲 OMR - Omani Rial (ر.ع)</option>
                  <option value="QAR">🇶🇦 QAR - Qatari Riyal (ر.ق)</option>
                  <option value="BHD">🇧🇭 BHD - Bahraini Dinar (د.ب)</option>
                </optgroup>
                <optgroup label="🌍 North Africa">
                  <option value="EGP">🇪🇬 EGP - Egyptian Pound (ج.م)</option>
                  <option value="LYD">🇱🇾 LYD - Libyan Dinar (ل.د)</option>
                  <option value="TND">🇹🇳 TND - Tunisian Dinar (د.ت)</option>
                  <option value="DZD">🇩🇿 DZD - Algerian Dinar (د.ج)</option>
                  <option value="MAD">🇲🇦 MAD - Moroccan Dirham (د.م)</option>
                </optgroup>
                <optgroup label="🌊 Levant">
                  <option value="JOD">🇯🇴 JOD - Jordanian Dinar (د.ا)</option>
                  <option value="LBP">🇱🇧 LBP - Lebanese Pound (ل.ل)</option>
                  <option value="SYP">🇸🇾 SYP - Syrian Pound (ل.س)</option>
                  <option value="ILS">🇵🇸 ILS - Shekel (₪)</option>
                </optgroup>
                <optgroup label="🏜️ Iraq & Yemen">
                  <option value="IQD">🇮🇶 IQD - Iraqi Dinar (ع.د)</option>
                  <option value="YER">🇾🇪 YER - Yemeni Rial (ر.ي)</option>
                </optgroup>
                <optgroup label="🌍 East Africa">
                  <option value="SDG">🇸🇩 SDG - Sudanese Pound (ج.س)</option>
                  <option value="SOS">🇸🇴 SOS - Somali Shilling (Sh.So)</option>
                  <option value="DJF">🇩🇯 DJF - Djiboutian Franc (Fdj)</option>
                  <option value="KMF">🇰🇲 KMF - Comorian Franc (CF)</option>
                  <option value="MRU">🇲🇷 MRU - Mauritanian Ouguiya (أ.م)</option>
                </optgroup>
                <optgroup label="💱 International">
                  <option value="USD">🇺🇸 USD - US Dollar ($)</option>
                  <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                  <option value="GBP">🇬🇧 GBP - British Pound (£)</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('platform.allCurrenciesSupported', 'All 22 Arab countries + international currencies supported')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('platform.defaultLanguage', 'Default Language')}
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowSignups"
                checked={settings.allowSignups}
                onChange={(e) => setSettings({ ...settings, allowSignups: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="allowSignups" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                {t('platform.allowSignups', 'Allow new business signups')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="maintenanceMode" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                {t('platform.maintenanceMode', 'Maintenance mode')}
              </label>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" icon={<Save className="w-4 h-4" />}>
                {t('common.save', 'Save Settings')}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
