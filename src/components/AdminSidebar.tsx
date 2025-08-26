"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { showConfirmDialog } from "@/lib/sweetalert";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

export default function AdminSidebar({ 
  isOpen, 
  onToggle, 
  isCollapsed = false, 
  onCollapseToggle 
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Get user role for display
  const [userRole, setUserRole] = useState('admin');
  
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
      }
    }
  }, []);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002 2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    },
    // {
    //   name: "Users",
    //   href: "/admin/users",
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    //     </svg>
    //   ),
    // },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: "Portions",
      href: "/admin/portions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      name: "Items",
      href: "/admin/items",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: "Billing",
      href: "/admin/waiter-orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    // {
    //   name: "Reports",
    //   href: "/admin/reports",
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //     </svg>
    //   ),
    // },
  ];

  const handleLogout = async () => {
    // Show confirmation dialog
    const result = await showConfirmDialog(
      'Confirm Logout',
      'Are you sure you want to logout?',
      'Yes, Logout',
      'Cancel'
    );

    // If user confirms logout
    if (result.isConfirmed) {
      const adminUser = localStorage.getItem('adminUser');
      let userRole = 'admin';
      
      if (adminUser) {
        try {
          const user = JSON.parse(adminUser);
          userRole = user.role;
        } catch (error) {
          console.error('Error parsing admin user data:', error);
        }
      }
      
      localStorage.removeItem('adminUser');
      
      // Redirect based on role
      if (userRole === 'CASHIER') {
        router.push('/'); // Staff login page
      } else {
        router.push('/admin/login'); // Admin login page
      }
    }
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Fixed position, full height */}
      <div
        className={`fixed top-0 left-0 z-50 ${sidebarWidth} h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Container with Fixed Height */}
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 flex-shrink-0">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <h1 className="text-lg font-bold text-white">
                  {userRole === 'CASHIER' ? 'Cashier' : 'Admin'}
                </h1>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 mx-auto relative">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              {onCollapseToggle && (
                <button
                  onClick={onCollapseToggle}
                  className="hidden lg:block p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                  </svg>
                </button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation - Scrollable if needed */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg border border-white/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="ml-3">{item.name}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout Button - Always at bottom */}
          <div className="flex-shrink-0 p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-200 group"
              title={isCollapsed ? "Logout" : undefined}
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && (
                <span className="ml-3">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 