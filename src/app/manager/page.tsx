"use client";

import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('staff_user');
    sessionStorage.removeItem('staff_session');
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Manager Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome, Manager!</h2>
            <p className="text-gray-600">
              This is your manager dashboard. Here you can oversee operations, manage staff, and monitor performance.
            </p>
            
            {/* Placeholder content */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Total Orders</h3>
                <p className="text-2xl font-bold text-blue-600">127</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900">Revenue Today</h3>
                <p className="text-2xl font-bold text-green-600">$2,450</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900">Active Staff</h3>
                <p className="text-2xl font-bold text-purple-600">15</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-medium text-orange-900">Table Occupancy</h3>
                <p className="text-2xl font-bold text-orange-600">85%</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left">
                  <h4 className="font-medium">View Reports</h4>
                  <p className="text-sm text-blue-100">Check daily/weekly performance</p>
                </button>
                <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                  <h4 className="font-medium">Manage Staff</h4>
                  <p className="text-sm text-green-100">Add, edit, or view staff members</p>
                </button>
                <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left">
                  <h4 className="font-medium">Monitor Kitchen</h4>
                  <p className="text-sm text-purple-100">Check order status and timing</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 