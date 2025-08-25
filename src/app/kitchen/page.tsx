"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showSuccessAlert } from '@/lib/sweetalert';
import Swal from "sweetalert2";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests: string | null;
  foodItem: {
    id: string;
    name: string;
    imageUrl: string | null;
    category: {
      id: string;
      name: string;
    };
  };
  portion: {
    id: string;
    name: string;
  };
}

interface Order {
  id: number;
  tableNumber: number;
  status: 'PENDING' | 'PREPARING' | 'READY';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    // Check if staff is logged in
    const storedUser = sessionStorage.getItem('staff_user');
    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'KITCHEN') {
        router.push("/");
        return;
      }
      setStaffUser(user);
    } catch (error) {
      console.error('Error parsing staff data:', error);
      router.push("/");
      return;
    }

    fetchOrders();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [router, statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/kitchen/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilter = () => {
    setStatusFilter('');
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'PREPARING' | 'READY') => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      // Refresh orders after successful update
      await fetchOrders();
      showSuccessAlert('Order status updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out and redirected to the login page.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result: any) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('staff_user');
        sessionStorage.removeItem('staff_session');
        router.push("/");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-orange-500 text-orange-800';
      case 'PREPARING':
        return 'border-blue-500 text-blue-800';
      case 'READY':
        return 'border-green-500 text-green-800';
      default:
        return 'border-gray-300 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'PREPARING':
        return '👨‍🍳';
      case 'READY':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'PREPARING';
      case 'PREPARING':
        return 'READY';
      default:
        return null;
    }
  };

  const getNextStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'Start Cooking';
      case 'PREPARING':
        return 'Mark Ready';
      default:
        return '';
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading orders...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Kitchen Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Dashboard title and stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                  <p className="text-sm text-gray-600">Your cooking command center</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="bg-orange-100 px-3 py-1 rounded-full">
                  <span className="text-orange-800 text-sm font-medium">
                    ⏳ Pending: {orders.filter(o => o.status === 'PENDING').length}
                  </span>
                </div>
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-800 text-sm font-medium">
                    👨‍🍳 Cooking: {orders.filter(o => o.status === 'PREPARING').length}
                  </span>
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-green-800 text-sm font-medium">
                    ✅ Ready: {orders.filter(o => o.status === 'READY').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Center - Welcome message */}
            <div className="flex-1 flex justify-center">
              <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold">
                  Welcome back, <span className="text-yellow-200">{staffUser?.name}</span>! 👨‍🍳
                </h2>
                <p className="text-blue-100 text-sm">Ready to create culinary magic?</p>
              </div>
            </div>

            {/* Right side - Refresh and Logout buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOrders}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl p-2 shadow-inner">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === '' 
                    ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 All Orders
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'PENDING' 
                    ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ⏳ Pending ({orders.filter(o => o.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setStatusFilter('PREPARING')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'PREPARING' 
                    ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                👨‍🍳 Cooking ({orders.filter(o => o.status === 'PREPARING').length})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'READY' 
                    ? 'bg-green-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ✅ Ready ({orders.filter(o => o.status === 'READY').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filter Indicator */}
        {statusFilter && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-semibold text-blue-900">
                    Filtered: {orders.length} {statusFilter === 'PENDING' ? 'pending' : 
                             statusFilter === 'PREPARING' ? 'cooking' : 
                             statusFilter === 'READY' ? 'ready' : ''} orders
                  </span>
                  <p className="text-xs text-blue-700">Showing filtered results</p>
                </div>
              </div>
              <button
                onClick={clearFilter}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="text-8xl mb-6">🍽️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">All Caught Up!</h3>
              <p className="text-gray-600 mb-6">No pending orders at the moment. Time for a coffee break! ☕</p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 Orders will appear here automatically when customers place them
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Order Header */}
                <div className={`px-6 py-4 border-b border-gray-100 ${
                  order.status === 'PENDING' ? 'bg-gradient-to-r from-orange-50 to-red-50' :
                  order.status === 'PREPARING' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
                  'bg-gradient-to-r from-green-50 to-emerald-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Order #{order.id}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Table {order.tableNumber}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Waiter: {order.staff.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.status)}`}>
                        <span className="mr-2">{getStatusIcon(order.status)}</span>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded-full">
                                {item.quantity}x
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900 text-lg">
                                  {item.foodItem.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.portion.name} • Rs. {item.unitPrice.toFixed(2)} each
                                </p>
                                {item.specialRequests && (
                                  <div className="mt-2 p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-800 flex items-center">
                                      <span className="mr-2">💬</span>
                                      <span className="font-medium">Special Request:</span> {item.specialRequests}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">
                              Rs. {item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <span className="text-yellow-600 text-lg">📝</span>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Order Notes:</p>
                          <p className="text-sm text-yellow-700 mt-1">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">
                        Rs. {order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {getNextStatus(order.status) && (
                    <div className="mt-6">
                      <button
                        onClick={() => handleStatusUpdate(order.id.toString(), getNextStatus(order.status) as 'PREPARING' | 'READY')}
                        disabled={updatingOrderId === order.id.toString()}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                          order.status === 'PENDING'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 disabled:from-orange-300 disabled:to-red-300'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 disabled:from-blue-300 disabled:to-indigo-300'
                        }`}
                      >
                        {updatingOrderId === order.id.toString() ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Updating...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>{getNextStatusButtonText(order.status)}</span>
                            {order.status === 'PENDING' ? '🔥' : '✅'}
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
