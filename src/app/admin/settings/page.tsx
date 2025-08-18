"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme, ThemeColor } from "@/contexts/ThemeContext";
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const themeOptions: { value: ThemeColor; name: string; preview: string }[] = [
  { value: 'blue', name: 'Ocean Blue', preview: 'bg-blue-500' },
  { value: 'green', name: 'Forest Green', preview: 'bg-green-500' },
  { value: 'purple', name: 'Royal Purple', preview: 'bg-purple-500' },
  { value: 'red', name: 'Crimson Red', preview: 'bg-red-500' },
  { value: 'yellow', name: 'Golden Yellow', preview: 'bg-yellow-500' },
  { value: 'indigo', name: 'Deep Indigo', preview: 'bg-indigo-500' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempServiceChargeRate, setTempServiceChargeRate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const { theme, settings, updateTheme, updateServiceChargeRate, isLoading: settingsLoading, getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedAdmin) {
      router.push('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(storedAdmin);
      setAdminUser(admin);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Set temp service charge rate when settings load
  useEffect(() => {
    if (settings) {
      setTempServiceChargeRate(settings.serviceChargeRate.toString());
    }
  }, [settings]);

  const handleThemeChange = async (newTheme: ThemeColor) => {
    try {
      await updateTheme(newTheme);
      showSuccessAlert('Theme updated successfully!');
    } catch (error) {
      showErrorAlert('Failed to update theme');
    }
  };

  const handleServiceChargeRateChange = async () => {
    const rate = parseFloat(tempServiceChargeRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showErrorAlert('Please enter a valid service charge rate between 0 and 100');
      return;
    }

    try {
      setIsSaving(true);
      await updateServiceChargeRate(rate);
      showSuccessAlert('Service charge rate updated successfully!');
    } catch (error) {
      showErrorAlert('Failed to update service charge rate');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('successfully') 
            ? `bg-${themeClasses.primaryBg} text-${themeClasses.primaryText} border border-${themeClasses.primaryBorder}`
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Theme Settings */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${themeClasses.primary} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Admin Dashboard Theme</h2>
              <p className="text-sm text-gray-600">Choose your preferred color theme for the admin interface</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  theme === option.value
                    ? `border-${themeClasses.primary} bg-${themeClasses.primaryBg}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${option.preview} rounded-full shadow-md`}></div>
                  <div className="text-left">
                    <div className={`font-medium ${
                      theme === option.value ? `text-${themeClasses.primaryText}` : 'text-gray-900'
                    }`}>
                      {option.name}
                    </div>
                    {theme === option.value && (
                      <div className={`text-sm text-${themeClasses.primary}`}>Currently Active</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Current Theme Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Theme Preview</h4>
            <div className="flex items-center space-x-4">
              <button className={`px-4 py-2 bg-${themeClasses.primary} hover:bg-${themeClasses.primaryHover} text-white rounded-lg transition-colors`}>
                Primary Button
              </button>
              <div className={`px-3 py-1 bg-${themeClasses.primaryBgLight} text-${themeClasses.primaryText} rounded-lg text-sm`}>
                Badge Example
              </div>
              <div className={`w-4 h-4 bg-${themeClasses.accent} rounded-full`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Charge Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${themeClasses.primary} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Service Charge Rate</h2>
              <p className="text-sm text-gray-600">Set the default service charge percentage for orders</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="max-w-sm">
            <label htmlFor="serviceChargeRate" className="block text-sm font-medium text-gray-700 mb-2">
              Service Charge Rate (%)
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                id="serviceChargeRate"
                min="0"
                max="100"
                step="0.1"
                value={tempServiceChargeRate}
                onChange={(e) => setTempServiceChargeRate(e.target.value)}
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeClasses.primary} focus:border-transparent`}
                placeholder="0.0"
              />
              <button
                onClick={handleServiceChargeRateChange}
                disabled={isSaving}
                className={`px-4 py-2 bg-${themeClasses.primary} hover:bg-${themeClasses.primaryHover} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Current rate: {settings?.serviceChargeRate}% | Enter a value between 0 and 100
            </p>
          </div>

          {/* Service Charge Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How Service Charge Works</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• The service charge is automatically applied to all orders</li>
              <li>• It appears as a separate line item in receipts</li>
              <li>• Staff can see the service charge amount in order details</li>
              <li>• Setting it to 0% disables the service charge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 