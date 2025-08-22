"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, MapPin, Phone, Mail, Clock, User, CreditCard } from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests: string | null;
  foodItem: {
    name: string;
    description: string | null;
  };
  portion: {
    name: string;
  };
}

interface Order {
  id: number;
  tableNumber: number;
  totalAmount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
}

export default function BillPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/bill/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setServiceChargeRate(settings.serviceChargeRate || 0);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    if (orderId) {
      fetchOrder();
      fetchSettings();
    }
  }, [orderId]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/bill/${orderId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h1>
          <p className="text-gray-600">{error || 'The requested bill could not be found.'}</p>
        </div>
      </div>
    );
  }

  const subtotal = order.totalAmount;
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + serviceCharge;

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Compact Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="bill-content">
          {/* Restaurant Header - Compact */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1.5 rounded-lg">
                  <Image
                    src="/images/logo.png"
                    alt="Restaurant Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Delicious Dining</h1>
                  <p className="text-blue-100 text-sm">Fine Dining Experience</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-blue-100 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  123 Restaurant Street
                </p>
                <p className="text-blue-100 flex items-center mt-0.5">
                  <Phone className="w-3 h-3 mr-1" />
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>

          {/* Bill Content - Compact */}
          <div className="p-4">
            {/* Bill Info Row */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">BILL #{order.id}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p className="flex items-center text-gray-700">
                    <MapPin className="w-3 h-3 mr-1" />
                    Table {order.tableNumber}
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="flex items-center text-gray-700">
                    <User className="w-3 h-3 mr-1" />
                    {order.staff.name}
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Customer Information - Compact */}
              {(order.customerName || order.customerEmail || order.customerPhone) && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">Customer</h3>
                  {order.customerName && (
                    <p className="text-gray-700">Name: {order.customerName}</p>
                  )}
                  {order.customerEmail && (
                    <p className="text-gray-700">Email: {order.customerEmail}</p>
                  )}
                  {order.customerPhone && (
                    <p className="text-gray-700">Phone: {order.customerPhone}</p>
                  )}
                </div>
              )}
            </div>

            {/* Order Items - Compact Table */}
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Order Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600 font-medium">Item</th>
                      <th className="text-center py-2 text-gray-600 font-medium">Portion</th>
                      <th className="text-center py-2 text-gray-600 font-medium">Qty</th>
                      <th className="text-right py-2 text-gray-600 font-medium">Price</th>
                      <th className="text-right py-2 text-gray-600 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.foodItem.name}</p>
                            {item.foodItem.description && (
                              <p className="text-xs text-gray-600">{item.foodItem.description}</p>
                            )}
                            {item.specialRequests && (
                              <p className="text-xs text-blue-600 italic">Special: {item.specialRequests}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center text-gray-700 text-sm">{item.portion.name}</td>
                        <td className="py-2 text-center text-gray-700 text-sm">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-700 text-sm">Rs. {item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium text-gray-900 text-sm">Rs. {item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary - Compact */}
            <div className="border-t border-gray-300 pt-3 mt-3">
              <div className="max-w-xs ml-auto">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {serviceChargeRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Service ({serviceChargeRate}%):</span>
                      <span className="font-medium">Rs. {serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="border-t border-gray-200 pt-3 mt-4 text-center">
              <p className="text-gray-600 text-sm mb-1">Thank you for dining with us!</p>
              <p className="text-xs text-gray-500">We hope to see you again soon.</p>
            </div>
          </div>
        </div>

        {/* Download Button - Compact */}
        <div className="mt-4 text-center">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center mx-auto text-sm"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 