"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getThemeClasses } = useTheme();
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

  if (isLoading) {
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
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className={`bg-${themeClasses.primary} rounded-lg p-6 text-white mb-6 shadow-lg`}>
        <h2 className="text-2xl font-bold mb-2 text-white">Welcome back, {adminUser.name}!</h2>
        <p className="text-white opacity-90">Here's what's happening with your restaurant today.</p>
      </div>
        
      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`bg-${themeClasses.primaryBg} p-4 rounded-lg border border-${themeClasses.primaryBorder}`}>
          <h3 className={`font-medium text-${themeClasses.primaryText}`}>Total Staff</h3>
          <p className={`text-2xl font-bold text-${themeClasses.primary}`}>24</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900">Today's Orders</h3>
          <p className="text-2xl font-bold text-blue-600">156</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-900">Revenue Today</h3>
          <p className="text-2xl font-bold text-green-600">$2,450</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-900">Active Tables</h3>
          <p className="text-2xl font-bold text-yellow-600">12</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/admin/users')}
            className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-${themeClasses.primary}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${themeClasses.primaryBg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-6 h-6 text-${themeClasses.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Manage Staff</div>
                <div className="text-sm text-gray-600">Add, edit, or remove staff members</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/items')}
            className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-${themeClasses.primary}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${themeClasses.primaryBg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-6 h-6 text-${themeClasses.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Menu Items</div>
                <div className="text-sm text-gray-600">Manage your restaurant menu</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/orders')}
            className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-${themeClasses.primary}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${themeClasses.primaryBg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-6 h-6 text-${themeClasses.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">View Orders</div>
                <div className="text-sm text-gray-600">Monitor and manage orders</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 