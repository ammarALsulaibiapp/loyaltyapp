import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { ARAB_CURRENCIES, getCurrencySymbol } from '../../lib/currencies'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Save, Building2, Palette, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch business settings
  const { data: business } = useQuery<any>({
    queryKey: ['business', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch notification settings
  const { data: notificationSettings } = useQuery<any>({
    queryKey: ['notification-settings', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null

      const { data, error } = await supabase
        .from('notification_settings')
        .select('sms_enabled, whatsapp_enabled, email_enabled, notify_customer_created, notify_reward_earned, notify_reward_redeemed, notify_birthday, notify_membership_upgrade')
        .eq('business_id', profile.business_id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification settings:', error)
        return null
      }
      return data
    },
  })

  const [generalSettings, setGeneralSettings] = useState<any>({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    description: '',
    currency: 'SAR',
  })

  const [brandingSettings, setBrandingSettings] = useState<any>({
    brand_color: '#0ea5e9',
    logo_url: '',
  })

  const [notifications, setNotifications] = useState({
    sms_enabled: false,
    whatsapp_enabled: false,
    email_enabled: false,
    notify_customer_created: true,
    notify_reward_earned: true,
    notify_reward_redeemed: false,
    notify_birthday: true,
    notify_membership_upgrade: true,
  })

  // Update state when business data loads
  useEffect(() => {
    if (business) {
      setGeneralSettings({
        name: business.name || '',
        email: business.email || '',
        phone_number: business.phone_number || '',
        address: business.address || '',
        description: business.description || '',
        currency: business.currency || 'SAR',
      })
      setBrandingSettings({
        brand_color: business.brand_color || '#0ea5e9',
        logo_url: business.logo_url || '',
      })
    }
  }, [business])

  // Update state when notification settings load
  useEffect(() => {
    if (notificationSettings) {
      setNotifications({
        sms_enabled: notificationSettings.sms_enabled || false,
        whatsapp_enabled: notificationSettings.whatsapp_enabled || false,
        email_enabled: notificationSettings.email_enabled || false,
        notify_customer_created: notificationSettings.notify_customer_created ?? true,
        notify_reward_earned: notificationSettings.notify_reward_earned ?? true,
        notify_reward_redeemed: notificationSettings.notify_reward_redeemed || false,
        notify_birthday: notificationSettings.notify_birthday ?? true,
        notify_membership_upgrade: notificationSettings.notify_membership_upgrade ?? true,
      })
    }
  }, [notificationSettings])

  // Update business mutation
  const updateBusinessMutation = useMutation({
    mutationFn: async (data: typeof generalSettings) => {
      if (!profile?.business_id) throw new Error('No business ID')

      const { error } = await (supabase
        .from('businesses') as any)
        .update(data)
        .eq('id', profile.business_id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
    },
  })

  // Update branding mutation
  const updateBrandingMutation = useMutation({
    mutationFn: async (data: typeof brandingSettings) => {
      if (!profile?.business_id) throw new Error('No business ID')

      const { error } = await (supabase
        .from('businesses') as any)
        .update(data)
        .eq('id', profile.business_id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
    },
  })

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: typeof notifications) => {
      if (!profile?.business_id) throw new Error('No business ID')

      const { error } = await (supabase
        .from('notification_settings') as any)
        .upsert({
          business_id: profile.business_id,
          ...data,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBusinessMutation.mutate(generalSettings)
  }

  const handleBrandingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBrandingMutation.mutate(brandingSettings)
  }

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateNotificationsMutation.mutate(notifications)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title', 'Settings')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.subtitle', 'Manage your business settings and preferences')}
        </p>
      </div>

      {/* General Settings */}
      <form onSubmit={handleGeneralSubmit}>
        <Card
          title={t('settings.general', 'General Settings')}
          subtitle={t('settings.generalDesc', 'Business information')}
          headerAction={
            <Button
              type="submit"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              loading={updateBusinessMutation.isPending}
            >
              {t('common.save', 'Save')}
            </Button>
          }
        >
          <div className="space-y-4">
            <Input
              label={t('settings.businessName', 'Business Name')}
              value={generalSettings.name}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, name: e.target.value })
              }
              required
            />
            <Input
              label={t('common.email', 'Email')}
              type="email"
              value={generalSettings.email}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, email: e.target.value })
              }
            />
            <Input
              label={t('common.phone', 'Phone Number')}
              value={generalSettings.phone_number}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, phone_number: e.target.value })
              }
            />
            <Input
              label={t('businesses.address', 'Address')}
              value={generalSettings.address}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, address: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('platform.defaultCurrency', 'Currency')}
              </label>
              <select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <optgroup label="🇸🇦 Gulf (GCC)">
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
                  <option value="MRU">🇲🇷 MRU - Mauritanian Ouguiya (أ.م)</option>
                </optgroup>
                <optgroup label="🌏 Levant">
                  <option value="JOD">🇯🇴 JOD - Jordanian Dinar (د.ا)</option>
                  <option value="LBP">🇱🇧 LBP - Lebanese Pound (ل.ل)</option>
                  <option value="SYP">🇸🇾 SYP - Syrian Pound (ل.س)</option>
                  <option value="ILS">🇵🇸 ILS - Shekel (₪)</option>
                </optgroup>
                <optgroup label="📍 Iraq & Yemen">
                  <option value="IQD">🇮🇶 IQD - Iraqi Dinar (ع.د)</option>
                  <option value="YER">🇾🇪 YER - Yemeni Rial (ر.ي)</option>
                </optgroup>
                <optgroup label="🌐 International">
                  <option value="USD">🇺🇸 USD - US Dollar ($)</option>
                  <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                  <option value="GBP">🇬🇧 GBP - British Pound (£)</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('platform.allCurrenciesSupported', 'All 22 Arab countries + international currencies supported')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('loyalty.description', 'Description')}
              </label>
              <textarea
                value={generalSettings.description}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder={t('settings.describeBusiness', 'Describe your business')}
              />
            </div>
          </div>
        </Card>
      </form>

      {/* Branding */}
      <form onSubmit={handleBrandingSubmit}>
        <Card
          title={t('settings.branding', 'Branding')}
          subtitle={t('settings.brandingDesc', 'Customize your brand appearance')}
          headerAction={
            <Button
              type="submit"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              loading={updateBrandingMutation.isPending}
            >
              {t('common.save', 'Save')}
            </Button>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.brandColor', 'Brand Color')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandingSettings.brand_color}
                  onChange={(e) =>
                    setBrandingSettings({ ...brandingSettings, brand_color: e.target.value })
                  }
                  className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <Input
                  value={brandingSettings.brand_color}
                  onChange={(e) =>
                    setBrandingSettings({ ...brandingSettings, brand_color: e.target.value })
                  }
                  placeholder="#0ea5e9"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.colorNotice', 'This color will be used in your loyalty cards and customer-facing materials')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.businessLogo', 'Business Logo URL')}
              </label>
              <div className="space-y-3">
                {brandingSettings.logo_url && (
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={brandingSettings.logo_url} 
                      alt="Business Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>'
                      }}
                    />
                  </div>
                )}
                <Input
                  value={brandingSettings.logo_url}
                  onChange={(e) =>
                    setBrandingSettings({ ...brandingSettings, logo_url: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  helperText="Enter the URL of your business logo image"
                />
              </div>
            </div>
          </div>
        </Card>
      </form>

      {/* Notification Settings */}
      <form onSubmit={handleNotificationsSubmit}>
        <Card
          title={t('settings.notifications', 'Notifications')}
          subtitle={t('settings.notificationsDesc', 'Configure customer communication settings')}
          headerAction={
            <Button
              type="submit"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              loading={updateNotificationsMutation.isPending}
            >
              {t('common.save', 'Save')}
            </Button>
          }
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {t('settings.commChannels', 'Communication Channels')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t('settings.sms', 'SMS Notifications')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('settings.smsDesc', 'Send notifications via SMS')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sms_enabled}
                      onChange={(e) =>
                        setNotifications({ ...notifications, sms_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t('settings.whatsapp', 'WhatsApp Notifications')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('settings.whatsappDesc', 'Send notifications via WhatsApp')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.whatsapp_enabled}
                      onChange={(e) =>
                        setNotifications({ ...notifications, whatsapp_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t('settings.emailNotice', 'Email Notifications')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('settings.emailDesc', 'Send notifications via Email')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email_enabled}
                      onChange={(e) =>
                        setNotifications({ ...notifications, email_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {t('settings.eventNotices', 'Event Notifications')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_customer_created"
                    checked={notifications.notify_customer_created}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        notify_customer_created: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="notify_customer_created"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t('settings.customerCreated', 'Customer Created')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_reward_earned"
                    checked={notifications.notify_reward_earned}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        notify_reward_earned: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="notify_reward_earned"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t('settings.rewardEarned', 'Reward Earned')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_reward_redeemed"
                    checked={notifications.notify_reward_redeemed}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        notify_reward_redeemed: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="notify_reward_redeemed"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t('settings.rewardRedeemed', 'Reward Redeemed')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_birthday"
                    checked={notifications.notify_birthday}
                    onChange={(e) =>
                      setNotifications({ ...notifications, notify_birthday: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="notify_birthday"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t('settings.birthdayReward', 'Birthday Reward')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_membership_upgrade"
                    checked={notifications.notify_membership_upgrade}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        notify_membership_upgrade: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="notify_membership_upgrade"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t('settings.membershipUpgrade', 'Membership Upgrade')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
