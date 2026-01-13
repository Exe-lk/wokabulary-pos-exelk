"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearOrder } from '@/redux/slices/orderSlice';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import TableNumberInput from '@/components/waiter/TableNumberInput';
import CategoryTabs from '@/components/waiter/CategoryTabs';
import FoodItemCard from '@/components/waiter/FoodItemCard';
import OrderCart from '@/components/waiter/OrderCart';

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

export default function CashierPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderState = useAppSelector((state) => state.order);
  
  const [categorizedItems, setCategorizedItems] = useState<CategorizedItems>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [staffUser, setStaffUser] = useState<any>(null);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  
  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billNumber, setBillNumber] = useState("");
  
  // Payment details
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedAdmin) {
      router.push("/admin/login");
      return;
    }
    try {
      const user = JSON.parse(storedAdmin);
      if (user.role !== 'CASHIER' && user.role !== 'admin') {
        router.push("/admin/login");
        return;
      }
      setStaffUser(user);
    } catch (error) {
      router.push("/admin/login");
    }
  }, [router]);

  // Fetch food items
  useEffect(() => {
    const fetchFoodItems = async () => {
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
        setIsLoading(false);
      }
    };

    if (staffUser) {
      fetchFoodItems();
    }
  }, [staffUser]);

  const handleCreateBill = async () => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !staffUser) {
      showErrorAlert('Please add items to the order and ensure table number is set');
      return;
    }

    // Calculate balance
    const total = orderState.totalAmount;
    const received = parseFloat(receivedAmount) || 0;
    const balance = received - total;

    if (received < total) {
      showErrorAlert(`Received amount (Rs. ${received.toFixed(2)}) is less than total (Rs. ${total.toFixed(2)})`);
      return;
    }

    setIsCreatingBill(true);
    try {
      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: staffUser.id,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes,
        customerData: {
          name: customerName || null,
          email: customerEmail || null,
          phone: customerPhone || null,
          isNewCustomer: !!customerPhone,
        },
        paymentData: {
          paymentMode,
          receivedAmount: received,
          balance: balance,
          referenceNumber: paymentMode === 'CARD' ? referenceNumber : undefined,
        },
        billNumber: billNumber || null,
      };

      const response = await fetch('/api/cashier/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bill');
      }

      const newOrder = await response.json();
      
      // Generate PDF
      const pdfResponse = await fetch(`/api/bill/${newOrder.id}/pdf`);
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${newOrder.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      // Show success message and clear order
      showSuccessAlert(`Bill created successfully! Order #${newOrder.id}`);
      dispatch(clearOrder());
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setBillNumber("");
      setReceivedAmount("");
      setReferenceNumber("");
      setPaymentMode('CASH');
      setShowPaymentModal(false);
      
    } catch (error: any) {
      showErrorAlert(`Failed to create bill: ${error.message}`);
    } finally {
      setIsCreatingBill(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!orderState.tableNumber || orderState.items.length === 0) {
      showErrorAlert('Please add items to the order');
      return;
    }
    setReceivedAmount(orderState.totalAmount.toFixed(2));
    setShowPaymentModal(true);
  };

  const categories = Object.keys(categorizedItems);
  const currentCategoryItems = categorizedItems[activeCategory]?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Cashier Dashboard...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Menu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cashier - Create Bill</h1>
              <p className="text-sm text-gray-500 mt-1">Create bills and generate PDFs instantly</p>
            </div>
            {staffUser && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{staffUser.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Details Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Menu Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
            {currentCategoryItems.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
                  <p className="text-gray-600">This category doesn't have any items yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {currentCategoryItems.map((item) => (
                  <FoodItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Order Cart */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <OrderCart />
          
          {/* Create Bill Button */}
          {orderState.items.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleProceedToPayment}
                disabled={isCreatingBill}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingBill ? 'Creating Bill...' : `Proceed to Payment - Rs. ${orderState.totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Total Amount */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">Rs. {orderState.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setPaymentMode('CASH')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        paymentMode === 'CASH'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMode('CARD')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        paymentMode === 'CARD'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Card
                    </button>
                  </div>
                </div>

                {/* Received Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received Amount
                  </label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Reference Number - Only show for CARD payment */}
                {paymentMode === 'CARD' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter card reference number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Balance */}
                {receivedAmount && parseFloat(receivedAmount) > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Balance:</span>
                      <span className={`text-lg font-bold ${
                        parseFloat(receivedAmount) >= orderState.totalAmount
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        Rs. {(parseFloat(receivedAmount) - orderState.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBill}
                    disabled={isCreatingBill || !receivedAmount || parseFloat(receivedAmount) < orderState.totalAmount || (paymentMode === 'CARD' && !referenceNumber.trim())}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {isCreatingBill ? 'Creating...' : 'Create Bill & PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
