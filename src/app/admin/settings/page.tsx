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

const themeOptions: { value: ThemeColor; name: string; preview: string; description: string }[] = [
  { value: 'blue', name: 'Ocean Blue', preview: 'bg-blue-500', description: 'Professional and trustworthy' },
  { value: 'green', name: 'Forest Green', preview: 'bg-green-500', description: 'Fresh and natural' },
  { value: 'purple', name: 'Royal Purple', preview: 'bg-purple-500', description: 'Elegant and sophisticated' },
  { value: 'red', name: 'Crimson Red', preview: 'bg-red-500', description: 'Bold and energetic' },
  { value: 'yellow', name: 'Golden Yellow', preview: 'bg-yellow-500', description: 'Warm and inviting' },
  { value: 'indigo', name: 'Deep Indigo', preview: 'bg-indigo-500', description: 'Modern and premium' },
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${themeClasses.buttonGradient} rounded-xl flex items-center justify-center`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure your restaurant management system preferences</p>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${themeClasses.buttonGradient} rounded-xl flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dashboard Theme</h2>
              <p className="text-gray-600">Choose your preferred color theme for the admin interface</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;
              const tempThemeClasses = {
                blue: { sidebarGradient: 'from-slate-900 via-blue-900 to-slate-900', buttonGradient: 'from-blue-600 to-cyan-600' },
                green: { sidebarGradient: 'from-slate-900 via-green-900 to-slate-900', buttonGradient: 'from-green-600 to-emerald-600' },
                purple: { sidebarGradient: 'from-slate-900 via-purple-900 to-slate-900', buttonGradient: 'from-purple-600 to-indigo-600' },
                red: { sidebarGradient: 'from-slate-900 via-red-900 to-slate-900', buttonGradient: 'from-red-600 to-pink-600' },
                yellow: { sidebarGradient: 'from-slate-900 via-yellow-900 to-slate-900', buttonGradient: 'from-yellow-600 to-orange-600' },
                indigo: { sidebarGradient: 'from-slate-900 via-indigo-900 to-slate-900', buttonGradient: 'from-indigo-600 to-purple-600' },
              };
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    isActive
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 ${option.preview} rounded-lg shadow-md flex-shrink-0`}></div>
                    <div className="text-left flex-1">
                      <div className={`font-semibold ${
                        isActive ? 'text-purple-700' : 'text-gray-900'
                      }`}>
                        {option.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      {isActive && (
                        <div className="text-sm text-purple-600 font-medium mt-2">✓ Currently Active</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Theme Preview */}
                  <div className="mt-3 flex space-x-2">
                    <div className={`w-8 h-8 bg-gradient-to-b ${tempThemeClasses[option.value as keyof typeof tempThemeClasses].sidebarGradient} rounded-lg`}></div>
                    <div className={`w-8 h-8 bg-gradient-to-r ${tempThemeClasses[option.value as keyof typeof tempThemeClasses].buttonGradient} rounded-lg`}></div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Current Theme Preview */}
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-4">Current Theme Preview</h4>
            <div className="flex items-center space-x-4">
              <button className={`px-4 py-2 bg-gradient-to-r ${themeClasses.buttonGradient} hover:${themeClasses.buttonGradientHover} text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}>
                Primary Button
              </button>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                Badge Example
              </div>
              <div className="w-4 h-4 bg-purple-500 rounded-full shadow-sm"></div>
            </div>
            
            {/* Sidebar Preview */}
            <div className="mt-4 flex items-center space-x-4">
              <div className="text-sm text-gray-600">Sidebar:</div>
              <div className={`w-16 h-8 bg-gradient-to-b ${themeClasses.sidebarGradient} rounded-lg shadow-md`}></div>
              <div className="text-sm text-gray-600">Main:</div>
              <div className={`w-16 h-8 bg-gradient-to-br ${themeClasses.mainGradient} rounded-lg shadow-md border`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Charge Settings */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${themeClasses.buttonGradient} rounded-xl flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Service Charge Rate</h2>
              <p className="text-gray-600">Set the default service charge percentage for orders</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="max-w-md">
            <label htmlFor="serviceChargeRate" className="block text-sm font-semibold text-gray-700 mb-3">
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="0.0"
              />
              <button
                onClick={handleServiceChargeRateChange}
                disabled={isSaving}
                className={`px-6 py-3 bg-gradient-to-r ${themeClasses.buttonGradient} hover:${themeClasses.buttonGradientHover} text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Current rate: <span className="font-semibold text-purple-600">{settings?.serviceChargeRate}%</span> | Enter a value between 0 and 100
            </p>
          </div>

          {/* Service Charge Info */}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-3">How Service Charge Works</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                The service charge is automatically applied to all orders
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                It appears as a separate line item in receipts
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Staff can see the service charge amount in order details
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Setting it to 0% disables the service charge
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 