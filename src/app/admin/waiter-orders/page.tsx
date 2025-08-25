"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearOrder, completeOrder } from '@/redux/slices/orderSlice';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import TableNumberInput from '@/components/waiter/TableNumberInput';
import CategoryTabs from '@/components/waiter/CategoryTabs';
import FoodItemCard from '@/components/waiter/FoodItemCard';
import OrderCart from '@/components/waiter/OrderCart';
import OrdersList from '@/components/waiter/OrdersList';
import CustomerDetailsModal from '@/components/waiter/CustomerDetailsModal';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoodItemPortion {
  id: string;
  portionId: string;
  price: number;
  portion: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  foodItemPortions: FoodItemPortion[];
}

interface CategoryData {
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  items: FoodItem[];
}

interface CategorizedItems {
  [categoryName: string]: CategoryData;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  isNewCustomer: boolean;
  customerId?: string;
}

interface PaymentData {
  receivedAmount: number;
  balance: number;
  paymentMode: 'CASH' | 'CARD';
}

export default function WaiterOrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderState = useAppSelector((state) => state.order);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Waiter functionality state
  const [categorizedItems, setCategorizedItems] = useState<CategorizedItems>({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'place-order' | 'my-orders'>('place-order');
  
  // Customer details modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);

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

  // Fetch food items when component mounts
  useEffect(() => {
    if (adminUser && Object.keys(categorizedItems).length === 0) {
      fetchFoodItems();
    }
  }, [adminUser]);

  const fetchFoodItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch('/api/waiter/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setCategorizedItems(data);
      
      // Set first category as active
      const categories = Object.keys(data);
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handlePlaceOrderClick = () => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !adminUser) {
      return;
    }
    setShowCustomerModal(true);
  };

  const handleCustomerModalConfirm = async (customerData: CustomerData, paymentData: PaymentData) => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !adminUser) {
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: adminUser.id,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes,
        customerData,
        paymentData
      };

      const response = await fetch('/api/waiter/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const newOrder = await response.json();
      
      // Show success message and clear order
      const paymentModeText = paymentData.paymentMode === 'CASH' ? 'Cash' : 'Card';
      const balanceText = paymentData.balance > 0 ? ` (Balance: Rs. ${paymentData.balance.toFixed(2)})` : '';
      showSuccessAlert(`Order placed successfully for Table ${orderState.tableNumber}! Order #${newOrder.id}. Payment: ${paymentModeText}${balanceText}`);
      dispatch(clearOrder());
      setShowCustomerModal(false);
      
    } catch (error: any) {
      showErrorAlert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCustomerModalClose = () => {
    setShowCustomerModal(false);
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Waiter Orders...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  // Place Order Tab Content
  const PlaceOrderContent = () => {
    if (isLoadingItems) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load menu</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchFoodItems}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    const categories = Object.keys(categorizedItems);
    const currentCategoryData = categorizedItems[activeCategory];

    return (
      <div className="h-full flex">
        {/* Left Side - Menu */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Table Number Input */}
          <TableNumberInput />

          {/* Category Tabs */}
          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          )}

          {/* Food Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentCategoryData && currentCategoryData.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentCategoryData.items.map((item) => (
                  <FoodItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
                  <p className="text-gray-500">This category doesn't have any items yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Order Cart */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <OrderCart />
          
          {/* Place Order Button */}
          {orderState.tableNumber && orderState.items.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handlePlaceOrderClick}
                disabled={isPlacingOrder}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isPlacingOrder ? 'Placing Order...' : `Place Order - Rs. ${orderState.totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('place-order')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'place-order'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Place Order
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ongoing Orders
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'place-order' && <PlaceOrderContent />}
        {activeTab === 'my-orders' && adminUser && <OrdersList staffId={adminUser.id} />}
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={showCustomerModal}
        onClose={handleCustomerModalClose}
        onConfirm={handleCustomerModalConfirm}
        totalAmount={orderState.totalAmount}
        isProcessing={isPlacingOrder}
      />
    </div>
  );
} 