"use client";

import { useState } from 'react';
import { X, Mail, User, Phone, Send } from 'lucide-react';
import { showSuccessAlert } from '@/lib/sweetalert';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    tableNumber: number;
    totalAmount: number;
    orderItems: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      specialRequests: string | null;
      foodItem: {
        name: string;
      };
      portion: {
        name: string;
      };
    }>;
  };
  onBillSent: () => void;
}

export default function BillModal({ isOpen, onClose, order, onBillSent }: BillModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerEmail) {
      setError('Email is required to send the bill');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${order.id}/bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerName || null,
          customerEmail,
          customerPhone: customerPhone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bill');
      }

      onBillSent();
      onClose();
      showSuccessAlert('Bill sent successfully!');
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Bill</h2>
            <p className="text-sm text-gray-600">Order #{order.id} - Table {order.tableNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.foodItem.name} ({item.portion.name}) × {item.quantity}
                </span>
                <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Customer Information</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !customerEmail}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Bill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 