"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showSuccessAlert } from '@/lib/sweetalert';

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
    sessionStorage.removeItem('staff_user');
    sessionStorage.removeItem('staff_session');
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Kitchen Dashboard</h1>
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Pending: {orders.filter(o => o.status === 'PENDING').length}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Cooking: {orders.filter(o => o.status === 'PREPARING').length}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready: {orders.filter(o => o.status === 'READY').length}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOrders}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Refresh
              </button>
              <span className="text-sm text-gray-600">
                Welcome, {staffUser?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === '' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'PENDING' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({orders.filter(o => o.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setStatusFilter('PREPARING')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'PREPARING' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cooking ({orders.filter(o => o.status === 'PREPARING').length})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'READY' 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ready ({orders.filter(o => o.status === 'READY').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filter Indicator */}
        {statusFilter && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  Filtered: {orders.length} {statusFilter === 'PENDING' ? 'pending' : 
                           statusFilter === 'PREPARING' ? 'cooking' : 
                           statusFilter === 'READY' ? 'ready' : ''} orders
                </span>
              </div>
              <button
                onClick={clearFilter}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
            <p className="text-gray-600">All caught up! No pending orders at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Table {order.tableNumber} • {formatTime(order.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Waiter: {order.staff.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        <span className="mr-1">{getStatusIcon(order.status)}</span>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {item.quantity}x
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.foodItem.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.portion.name} • ${item.unitPrice.toFixed(2)} each
                              </p>
                              {item.specialRequests && (
                                <p className="text-sm text-orange-600 mt-1">
                                  💬 {item.specialRequests}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Notes:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {getNextStatus(order.status) && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleStatusUpdate(order.id.toString(), getNextStatus(order.status) as 'PREPARING' | 'READY')}
                        disabled={updatingOrderId === order.id.toString()}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          order.status === 'PENDING'
                            ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                        }`}
                      >
                        {updatingOrderId === order.id.toString() ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </div>
                        ) : (
                          getNextStatusButtonText(order.status)
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
