"use client";

import { useState } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

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

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdded: () => void;
  ingredient: Ingredient;
}

export default function AddStockModal({ isOpen, onClose, onStockAdded, ingredient }: AddStockModalProps) {
  const [quantity, setQuantity] = useState("");
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

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredient.id}/add-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: quantityNum }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add stock');
      }

      setQuantity("");
      onStockAdded();
      onClose();
      
      // Check if this brings the ingredient above reorder level
      const newStockLevel = ingredient.currentStockQuantity + quantityNum;
      const wasBelowReorderLevel = ingredient.currentStockQuantity < ingredient.reorderLevel;
      const isNowAboveReorderLevel = newStockLevel >= ingredient.reorderLevel;
      
      if (wasBelowReorderLevel && isNowAboveReorderLevel) {
        // Special alert for bringing stock above reorder level
        Swal.fire({
          title: 'Stock Replenished!',
          html: `
            <div class="text-center">
              <p class="mb-2">✅ <strong>${ingredient.name}</strong> is now above reorder level!</p>
              <p class="text-sm text-gray-600">New stock level: ${newStockLevel} ${ingredient.unitOfMeasurement}</p>
              <p class="text-sm text-gray-600">Reorder level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#10b981',
          background: '#ecfdf5',
          customClass: {
            popup: 'rounded-lg',
            title: 'text-green-800 font-semibold',
            htmlContainer: 'text-green-700'
          }
        });
      } else {
        // Regular success alert
        showSuccessAlert(`Stock added successfully! ${quantityNum} ${ingredient.unitOfMeasurement} added to ${ingredient.name}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Ingredient:</strong> {ingredient.name}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Current Stock:</strong> {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Reorder Level:</strong> {ingredient.reorderLevel} {ingredient.unitOfMeasurement}
          </p>
          {ingredient.currentStockQuantity < ingredient.reorderLevel && (
            <p className="text-sm text-orange-600 font-medium mt-2">
              ⚠️ Low stock alert: Current stock is below reorder level
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Add *
            </label>
            <div className="relative">
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter quantity in ${ingredient.unitOfMeasurement}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">{ingredient.unitOfMeasurement}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                "Add Stock"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
