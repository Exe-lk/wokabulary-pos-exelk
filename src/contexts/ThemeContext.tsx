"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo';

interface Settings {
  id: string;
  serviceChargeRate: number;
  theme: ThemeColor;
  createdAt: string;
  updatedAt: string;
}

interface ThemeContextType {
  theme: ThemeColor;
  settings: Settings | null;
  updateTheme: (newTheme: ThemeColor) => Promise<void>;
  updateServiceChargeRate: (rate: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  getThemeClasses: () => {
    primary: string;
    primaryHover: string;
    primaryText: string;
    primaryBg: string;
    primaryBgLight: string;
    primaryBorder: string;
    accent: string;
    sidebarGradient: string;
    mainGradient: string;
    buttonGradient: string;
    buttonGradientHover: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [isLoading, setIsLoading] = useState(true);

  const getThemeClasses = () => {
    const themes = {
      blue: {
        primary: 'blue-600',
        primaryHover: 'blue-700',
        primaryText: 'blue-700',
        primaryBg: 'blue-50',
        primaryBgLight: 'blue-100',
        primaryBorder: 'blue-200',
        accent: 'blue-500',
        sidebarGradient: 'from-slate-900 via-blue-900 to-slate-900',
        mainGradient: 'from-slate-50 via-blue-50 to-slate-50',
        buttonGradient: 'from-blue-600 to-cyan-600',
        buttonGradientHover: 'from-blue-700 to-cyan-700',
      },
      green: {
        primary: 'green-600',
        primaryHover: 'green-700',
        primaryText: 'green-700',
        primaryBg: 'green-50',
        primaryBgLight: 'green-100',
        primaryBorder: 'green-200',
        accent: 'green-500',
        sidebarGradient: 'from-slate-900 via-green-900 to-slate-900',
        mainGradient: 'from-slate-50 via-green-50 to-slate-50',
        buttonGradient: 'from-green-600 to-emerald-600',
        buttonGradientHover: 'from-green-700 to-emerald-700',
      },
      purple: {
        primary: 'purple-600',
        primaryHover: 'purple-700',
        primaryText: 'purple-700',
        primaryBg: 'purple-50',
        primaryBgLight: 'purple-100',
        primaryBorder: 'purple-200',
        accent: 'purple-500',
        sidebarGradient: 'from-slate-900 via-purple-900 to-slate-900',
        mainGradient: 'from-slate-50 via-purple-50 to-slate-50',
        buttonGradient: 'from-purple-600 to-indigo-600',
        buttonGradientHover: 'from-purple-700 to-indigo-700',
      },
      red: {
        primary: 'red-600',
        primaryHover: 'red-700',
        primaryText: 'red-700',
        primaryBg: 'red-50',
        primaryBgLight: 'red-100',
        primaryBorder: 'red-200',
        accent: 'red-500',
        sidebarGradient: 'from-slate-900 via-red-900 to-slate-900',
        mainGradient: 'from-slate-50 via-red-50 to-slate-50',
        buttonGradient: 'from-red-600 to-pink-600',
        buttonGradientHover: 'from-red-700 to-pink-700',
      },
      yellow: {
        primary: 'yellow-600',
        primaryHover: 'yellow-700',
        primaryText: 'yellow-700',
        primaryBg: 'yellow-50',
        primaryBgLight: 'yellow-100',
        primaryBorder: 'yellow-200',
        accent: 'yellow-500',
        sidebarGradient: 'from-slate-900 via-yellow-900 to-slate-900',
        mainGradient: 'from-slate-50 via-yellow-50 to-slate-50',
        buttonGradient: 'from-yellow-600 to-orange-600',
        buttonGradientHover: 'from-yellow-700 to-orange-700',
      },
      indigo: {
        primary: 'indigo-600',
        primaryHover: 'indigo-700',
        primaryText: 'indigo-700',
        primaryBg: 'indigo-50',
        primaryBgLight: 'indigo-100',
        primaryBorder: 'indigo-200',
        accent: 'indigo-500',
        sidebarGradient: 'from-slate-900 via-indigo-900 to-slate-900',
        mainGradient: 'from-slate-50 via-indigo-50 to-slate-50',
        buttonGradient: 'from-indigo-600 to-purple-600',
        buttonGradientHover: 'from-indigo-700 to-purple-700',
      },
    };

    return themes[theme];
  };

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setTheme(data.theme);
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newTheme: ThemeColor) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setTheme(newTheme);
      } else {
        throw new Error('Failed to update theme');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const updateServiceChargeRate = async (rate: number) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceChargeRate: rate }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
      } else {
        throw new Error('Failed to update service charge rate');
      }
    } catch (error) {
      console.error('Error updating service charge rate:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        settings,
        updateTheme,
        updateServiceChargeRate,
        refreshSettings,
        isLoading,
        getThemeClasses,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 