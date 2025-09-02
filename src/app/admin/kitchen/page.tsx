"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OrderItemIngredient {
  id: string;
  quantity: number;
  ingredient: {
    id: string;
    name: string;
    unitOfMeasurement: string;
  };
}

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
  ingredients: OrderItemIngredient[];
}

interface Order {
  id: number;
  tableNumber: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  orderItems: OrderItem[];
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasurement: string;
  currentStockQuantity?: number;
  reorderLevel?: number;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminKitchenManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);

  useEffect(() => {
    // Check if admin/cashier is logged in
    const storedUser = localStorage.getItem('adminUser');
    if (!storedUser) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (!['admin', 'CASHIER'].includes(user.role)) {
        router.push("/admin/login");
        return;
      }
      setAdminUser(user);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push("/admin/login");
      return;
    }

    fetchOrders();
    fetchIngredients();
    // Set up auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchOrders();
      fetchIngredients();
    }, 10000);
    return () => clearInterval(interval);
  }, [router, statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

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
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients?withStock=true');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: 'PREPARING' | 'READY') => {
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

      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: `Cancel Order #${orderId}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
      input: 'text',
      inputPlaceholder: 'Reason (optional)',
    });

    if (result.isConfirmed) {
      setUpdatingOrderId(orderId);
      try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: result.value || 'Cancelled by admin' }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel order');
        }

        await fetchOrders();
      } catch (err: any) {
        console.error('Error cancelling order:', err);
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'READY':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
    
    return date.toLocaleDateString();
  };

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

  if (!adminUser) {
    return null;
  }

  const filteredOrders = orders.filter(order => {
    // Filter by status
    const statusMatch = !statusFilter || order.status === statusFilter;
    
    // Filter by search term
    const searchMatch = !searchTerm || 
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.tableNumber.toString().includes(searchTerm.toLowerCase()) ||
      order.staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderItems.some(item => 
        item.foodItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return statusMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Manage and update order statuses</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Auto-refresh: 10s
              </div>
              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  showIngredients 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {showIngredients ? 'Hide Ingredients' : 'Show Ingredients'}
              </button>
              <button
                onClick={fetchOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by order ID, table, staff, or food item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ingredients Section */}
      {showIngredients && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Kitchen Ingredients & Stock</h2>
                  <p className="text-sm text-gray-600">Monitor ingredient levels and reorder points</p>
                </div>
              </div>
            </div>
                          <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                                         <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Ingredient Name
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Description
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Unit of Measurement
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Current Stock
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Reorder Level
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Stock Status
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Last Updated
                         </th>
                       </tr>
                     </thead>
                                         <tbody className="bg-white divide-y divide-gray-200">
                       {ingredients.map((ingredient) => (
                         <tr key={ingredient.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-sm text-gray-900 max-w-xs">
                               {ingredient.description || 'No description'}
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900 font-medium">{ingredient.unitOfMeasurement}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">
                               {ingredient.currentStockQuantity !== undefined 
                                 ? <span className="font-semibold">{ingredient.currentStockQuantity}</span>
                                 : <span className="text-gray-400">N/A</span>
                               }
                               <span className="text-gray-500 ml-1">{ingredient.unitOfMeasurement}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">
                               {ingredient.reorderLevel !== undefined 
                                 ? <span className="font-semibold">{ingredient.reorderLevel}</span>
                                 : <span className="text-gray-400">N/A</span>
                               }
                               <span className="text-gray-500 ml-1">{ingredient.unitOfMeasurement}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                               ingredient.currentStockQuantity && ingredient.reorderLevel
                                 ? ingredient.currentStockQuantity <= ingredient.reorderLevel
                                   ? 'bg-red-100 text-red-800 border border-red-200'
                                   : ingredient.currentStockQuantity <= ingredient.reorderLevel * 1.5
                                   ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                   : 'bg-green-100 text-green-800 border border-green-200'
                                 : 'bg-gray-100 text-gray-800 border border-gray-200'
                             }`}>
                               {ingredient.currentStockQuantity && ingredient.reorderLevel
                                 ? ingredient.currentStockQuantity <= ingredient.reorderLevel
                                   ? '⚠️ Low Stock'
                                   : ingredient.currentStockQuantity <= ingredient.reorderLevel * 1.5
                                   ? '⚠️ Medium Stock'
                                   : '✅ Good Stock'
                                 : 'N/A'
                               }
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-500">
                               {ingredient.updatedAt ? new Date(ingredient.updatedAt).toLocaleDateString() : 'N/A'}
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
          </div>
        </div>
      )}

      {/* Ingredients Summary for Pending Orders */}
      {showIngredients && pendingOrders.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Ingredients Needed for Pending Orders</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const ingredientTotals = new Map<string, { name: string; totalQuantity: number; unit: string }>();
                  
                  pendingOrders.forEach(order => {
                    order.orderItems.forEach(item => {
                      if (item.ingredients) {
                        item.ingredients.forEach(ingredient => {
                          const key = ingredient.ingredient.id;
                          const existing = ingredientTotals.get(key);
                          const quantity = ingredient.quantity * item.quantity;
                          
                          if (existing) {
                            existing.totalQuantity += quantity;
                          } else {
                            ingredientTotals.set(key, {
                              name: ingredient.ingredient.name,
                              totalQuantity: quantity,
                              unit: ingredient.ingredient.unitOfMeasurement
                            });
                          }
                        });
                      }
                    });
                  });
                  
                  return Array.from(ingredientTotals.values()).map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center bg-white px-3 py-2 rounded border">
                      <span className="text-sm font-medium text-gray-700">{ingredient.name}</span>
                      <span className="text-sm text-blue-600 font-semibold">
                        {ingredient.totalQuantity} {ingredient.unit}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setStatusFilter('')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === '' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === 'PENDING' 
                  ? 'border-yellow-500 text-yellow-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('PREPARING')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === 'PREPARING' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preparing ({preparingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === 'READY' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ready ({readyOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredOrders.length === 0 
              ? 'No orders found' 
              : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length} orders`
            }
            {searchTerm && (
              <span className="ml-2">
                for "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No orders match "${searchTerm}". Try adjusting your search.`
                : statusFilter 
                  ? `No ${statusFilter.toLowerCase()} orders right now.` 
                  : 'No kitchen orders at the moment.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedOrders.map((order) => (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border-2 ${getStatusColor(order.status)} p-6`}>
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#{order.id}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Table {order.tableNumber}</h3>
                      <p className="text-sm text-gray-500">{order.staff.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(order.createdAt)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.foodItem.name}</p>
                          <p className="text-xs text-gray-500">{item.portion.name}</p>
                          {item.specialRequests && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ {item.specialRequests}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 ml-2">×{item.quantity}</span>
                      </div>
                      
                      {/* Ingredients */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                          <div className="space-y-1">
                            {item.ingredients.map((ingredient) => (
                              <div key={ingredient.id} className="flex justify-between text-xs">
                                <span className="text-gray-600">{ingredient.ingredient.name}</span>
                                <span className="text-gray-800 font-medium">
                                  {ingredient.quantity} {ingredient.ingredient.unitOfMeasurement}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <p className="text-xs text-gray-500">+ {order.orderItems.length - 3} more items</p>
                  )}
                </div>

                {/* Special Notes */}
                {order.notes && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Special Notes:</p>
                    <p className="text-xs text-yellow-700">{order.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-lg font-bold text-gray-900">Rs. {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'PENDING' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        disabled={updatingOrderId === order.id}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {updatingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Starting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Start Preparing
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {updatingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                      disabled={updatingOrderId === order.id}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {updatingOrderId === order.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Marking...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Ready
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <div className="w-full bg-green-100 text-green-800 py-3 rounded-lg font-medium text-center flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready for Pickup
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}