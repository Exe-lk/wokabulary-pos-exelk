"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if we're on the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // If we're on the login page, don't check authentication
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

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
  }, [router, isLoginPage]);

  // If we're on the login page, render children directly without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

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
    <ThemeProvider>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar - Fixed position */}
        <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content - Takes remaining space and is scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          {/* Header - Fixed at top */}
          <header className="bg-white shadow-sm border-b flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {adminUser.name}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content Area - Scrollable */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 