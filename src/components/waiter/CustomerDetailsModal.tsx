"use client";

import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
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

interface FormValues {
  name: string;
  email: string;
  phone: string;
  paymentMode: 'CASH' | 'CARD';
  receivedAmount: number;
}

export default function CustomerDetailsModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  isProcessing 
}: CustomerDetailsModalProps) {
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<ExistingCustomer | null>(null);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);

  // Validation function
  const validateForm = (values: FormValues) => {
    const errors: any = {};

    // Phone validation
    if (!values.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,}$/.test(values.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    // Name validation
    if (!values.name) {
      errors.name = 'Customer name is required';
    } else if (values.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Email validation (optional but validate if provided)
    if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Received amount validation
    if (!values.receivedAmount || values.receivedAmount < totalAmount) {
      errors.receivedAmount = `Amount received must be at least Rs. ${totalAmount.toFixed(2)}`;
    }

    return errors;
  };

  const handlePhoneChange = async (phone: string, setFieldValue: (field: string, value: any) => void) => {
    if (phone.length >= 10) {
      setIsSearchingCustomer(true);
      try {
        const response = await fetch(`/api/customers/search?phone=${phone}`);
        if (response.ok) {
          const customer = await response.json();
          if (customer) {
            setExistingCustomer(customer);
            setCustomerId(customer.id);
            setFieldValue('name', customer.name);
            setFieldValue('email', customer.email || '');
            setFieldValue('phone', customer.phone);
          } else {
            setExistingCustomer(null);
            setCustomerId(undefined);
          }
        }
      } catch (error) {
        console.error('Error searching customer:', error);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      setExistingCustomer(null);
      setCustomerId(undefined);
    }
  };

  const handleSubmit = (values: FormValues) => {
    const customerData: CustomerData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      isNewCustomer: !existingCustomer,
      customerId: customerId
    };

    const paymentData: PaymentData = {
      receivedAmount: values.receivedAmount,
      balance: Math.max(0, values.receivedAmount - totalAmount),
      paymentMode: values.paymentMode
    };

    onConfirm(customerData, paymentData);
  };

  const initialValues: FormValues = {
    name: '',
    email: '',
    phone: '',
    paymentMode: 'CASH',
    receivedAmount: totalAmount
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

        <Formik
          initialValues={initialValues}
          validate={validateForm}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue, handleChange, handleBlur, isValid, dirty }) => (
            <Form className="p-6">
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
                    <Field
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleChange(e);
                        handlePhoneChange(e.target.value, setFieldValue);
                      }}
                      onBlur={handleBlur}
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
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
                    <Field
                      type="text"
                      id="name"
                      name="name"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Customer Email */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
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
                      onClick={() => setFieldValue('paymentMode', 'CASH')}
                      className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        values.paymentMode === 'CASH'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="font-medium">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFieldValue('paymentMode', 'CARD')}
                      className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        values.paymentMode === 'CARD'
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
                    <Field
                      type="number"
                      id="receivedAmount"
                      name="receivedAmount"
                      min={totalAmount}
                      step="0.01"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.receivedAmount && touched.receivedAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount received"
                    />
                  </div>
                  <ErrorMessage name="receivedAmount" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Balance */}
                {values.receivedAmount > totalAmount && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance to Return
                    </label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-lg font-semibold text-green-700">
                        Rs. {(values.receivedAmount - totalAmount).toFixed(2)}
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
                  disabled={isProcessing || !isValid || !dirty}
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
