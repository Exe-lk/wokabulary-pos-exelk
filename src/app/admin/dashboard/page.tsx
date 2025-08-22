"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <h2 className="text-3xl font-bold mb-3 text-white">Welcome back, {adminUser.name}!</h2>
        <p className="text-blue-100 text-lg">Here's what's happening with your restaurant today.</p>
      </div>
        
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Total Staff</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
          <p className="text-sm text-blue-600 mt-1">Active members</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Today's Orders</h3>
          <p className="text-3xl font-bold text-blue-600">156</p>
          <p className="text-sm text-blue-600 mt-1">+12% from yesterday</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Revenue Today</h3>
                          <p className="text-3xl font-bold text-blue-600">Rs. 2,450</p>
          <p className="text-sm text-blue-600 mt-1">+8% from yesterday</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Active Tables</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-blue-600 mt-1">Currently occupied</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => router.push('/admin/users')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Manage Staff</div>
                <div className="text-sm text-gray-600">Add, edit, or remove staff members</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/items')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Menu Items</div>
                <div className="text-sm text-gray-600">Manage your restaurant menu</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/orders')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">View Orders</div>
                <div className="text-sm text-gray-600">Monitor and manage orders</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Additional Quick Actions */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">More Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => router.push('/admin/waiter-orders')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Waiter Orders</div>
                <div className="text-sm text-gray-600">Place orders and manage waiter activities</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/categories')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Categories</div>
                <div className="text-sm text-gray-600">Manage menu categories</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/admin/reports')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Reports</div>
                <div className="text-sm text-gray-600">View analytics and reports</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 