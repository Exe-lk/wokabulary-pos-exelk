"use client";

import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, CreditCard, DollarSign } from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerData: CustomerData, paymentData: PaymentData) => void;
  totalAmount: number;
  isProcessing: boolean;
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

interface ExistingCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

export default function CustomerDetailsModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  isProcessing 
}: CustomerDetailsModalProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    isNewCustomer: true
  });
  
  const [paymentData, setPaymentData] = useState<PaymentData>({
    receivedAmount: totalAmount,
    balance: 0,
    paymentMode: 'CASH'
  });

  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<ExistingCustomer | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCustomerData({
        name: '',
        email: '',
        phone: '',
        isNewCustomer: true
      });
      setPaymentData({
        receivedAmount: totalAmount,
        balance: 0,
        paymentMode: 'CASH'
      });
      setExistingCustomer(null);
    }
  }, [isOpen, totalAmount]);

  // Update received amount when total amount changes
  useEffect(() => {
    setPaymentData(prev => ({
      ...prev,
      receivedAmount: totalAmount,
      balance: 0
    }));
  }, [totalAmount]);

  // Calculate balance when received amount changes
  useEffect(() => {
    setPaymentData(prev => ({
      ...prev,
      balance: Math.max(0, prev.receivedAmount - totalAmount)
    }));
  }, [paymentData.receivedAmount, totalAmount]);

  const handlePhoneChange = async (phone: string) => {
    setCustomerData(prev => ({ ...prev, phone }));
    
    if (phone.length >= 10) {
      setIsSearchingCustomer(true);
      try {
        const response = await fetch(`https://wokabulary.netlify.app/api/customers/search?phone=${phone}`);
        if (response.ok) {
          const customer = await response.json();
          if (customer) {
            setExistingCustomer(customer);
            setCustomerData(prev => ({
              ...prev,
              name: customer.name,
              email: customer.email || '',
              phone: customer.phone,
              isNewCustomer: false,
              customerId: customer.id
            }));
          } else {
            setExistingCustomer(null);
            setCustomerData(prev => ({
              ...prev,
              isNewCustomer: true,
              customerId: undefined
            }));
          }
        }
      } catch (error) {
        console.error('Error searching customer:', error);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      setExistingCustomer(null);
      setCustomerData(prev => ({
        ...prev,
        isNewCustomer: true,
        customerId: undefined
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerData.name || !customerData.phone) {
      return;
    }

    onConfirm(customerData, paymentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
            <p className="text-sm text-gray-600">Complete order for Rs. {totalAmount.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            
            {/* Phone Number */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
                {isSearchingCustomer && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {existingCustomer && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Existing customer found: {existingCustomer.name}
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Order Total:</span>
                <span className="font-medium">Rs. {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMode: 'CASH' }))}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    paymentData.paymentMode === 'CASH'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMode: 'CARD' }))}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    paymentData.paymentMode === 'CARD'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Card</span>
                </button>
              </div>
            </div>

            {/* Amount Received */}
            <div className="mb-4">
              <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount Received <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  id="receivedAmount"
                  value={paymentData.receivedAmount}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    receivedAmount: parseFloat(e.target.value) || 0 
                  }))}
                  min={totalAmount}
                  step="0.01"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount received"
                />
              </div>
            </div>

            {/* Balance */}
            {paymentData.balance > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance to Return
                </label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <span className="text-lg font-semibold text-green-700">
                    Rs. {paymentData.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !customerData.name || !customerData.phone || paymentData.receivedAmount < totalAmount}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
