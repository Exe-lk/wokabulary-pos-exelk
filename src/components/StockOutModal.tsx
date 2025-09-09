"use client";

import { useState } from "react";
import { showCustomAlert, showErrorAlert } from '@/lib/sweetalert';

interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unitOfMeasurement: string;
  currentStockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockOut: () => void;
  ingredient: Ingredient;
}

export default function StockOutModal({ isOpen, onClose, onStockOut, ingredient }: StockOutModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("Please enter a valid quantity greater than 0");
      setIsLoading(false);
      return;
    }

    if (quantityNum > ingredient.currentStockQuantity) {
      setError(`Cannot stock out more than available. Current stock: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}`);
      setIsLoading(false);
      return;
    }

    const finalReason = reason === "Other" ? customReason.trim() : reason.trim();
    if (!finalReason) {
      setError("Please provide a reason for stock out");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredient.id}/stock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          quantity: quantityNum,
          reason: finalReason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process stock out');
      }

      // Show success message
      showCustomAlert({
        title: 'Stock Out Successful',
        html: `
          <div class="text-left">
            <p class="mb-2">Successfully stocked out <strong>${quantityNum} ${ingredient.unitOfMeasurement}</strong> of <strong>${ingredient.name}</strong>.</p>
            <p class="text-sm text-gray-600">Reason: ${finalReason}</p>
            <p class="text-sm text-gray-600">Remaining stock: ${ingredient.currentStockQuantity - quantityNum} ${ingredient.unitOfMeasurement}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });

      setQuantity("");
      setReason("");
      setCustomReason("");
      onStockOut();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showErrorAlert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity("");
    setReason("");
    setCustomReason("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Stock Out</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{ingredient.name}</h4>
            <div className="text-sm text-gray-600">
              <p>Current Stock: <span className="font-semibold">{ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}</span></p>
              <p>Reorder Level: <span className="font-semibold">{ingredient.reorderLevel} {ingredient.unitOfMeasurement}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity to Stock Out
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="quantity"
                  step="0.01"
                  min="0.01"
                  max={ingredient.currentStockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={`Enter quantity (max: ${ingredient.currentStockQuantity})`}
                  required
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500">
                  {ingredient.unitOfMeasurement}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Stock Out
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a reason</option>
                <option value="Expired">Expired</option>
                <option value="Damaged">Damaged</option>
                <option value="Spoiled">Spoiled</option>
                <option value="Wasted">Wasted</option>
                <option value="Theft">Theft</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {reason === "Other" && (
              <div className="mb-4">
                <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Reason
                </label>
                <input
                  type="text"
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter custom reason"
                  required={reason === "Other"}
                />
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Stock Out'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
