import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { User, Key, Globe, Bell } from 'lucide-react'

export default function SuperAdminSettings() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Profile settings saved! (Feature coming soon)')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('nav.settings', 'Settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and system preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Profile Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your personal details
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              required
              disabled
              helperText="Email cannot be changed"
            />
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Security
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Change your password and security settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button variant="outline" onClick={() => alert('Change password feature coming soon')}>
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* System Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                System Configuration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Platform-wide settings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Platform Name
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">SabaaaPass</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Version
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Bell className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notification Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure your notification settings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" defaultChecked />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Receive email updates about system activity
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" defaultChecked />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New Business Alerts
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get notified when new businesses sign up
                </p>
              </div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}
