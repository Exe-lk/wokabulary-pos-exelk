"use client";

import { useState, useEffect } from "react";
import AddFoodItemModal from "@/components/AddFoodItemModal";

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
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  foodItemPortions: FoodItemPortion[];
}

export default function ManageItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchFoodItems = async () => {
    try {
      const response = await fetch('/api/admin/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const handleFoodItemAdded = () => {
    fetchFoodItems();
  };

  const handleEditItem = (itemId: string) => {
    // TODO: Implement edit item functionality
    console.log("Edit item:", itemId);
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const response = await fetch(`/api/admin/food-items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemId,
          isActive: !item.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item availability');
      }

      // Update local state
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getPriceRange = (portions: FoodItemPortion[]) => {
    if (portions.length === 0) return 'N/A';
    if (portions.length === 1) return formatPrice(portions[0].price);
    
    const prices = portions.map(p => p.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    
    if (minPrice === maxPrice) return formatPrice(minPrice);
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Food Items</h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage your menu items</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Food Item</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Item</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Portions & Prices</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Price Range</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{item.category.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {item.foodItemPortions.map((portion) => (
                        <div key={portion.id} className="text-sm">
                          <span className="text-gray-700">{portion.portion.name}</span>
                          <span className="text-purple-600 font-medium ml-2">
                            {formatPrice(portion.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      {getPriceRange(item.foodItemPortions)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.isActive ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditItem(item.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`text-sm font-medium ${
                          item.isActive
                            ? "text-red-600 hover:text-red-800"
                            : "text-green-600 hover:text-green-800"
                        }`}
                      >
                        {item.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No food items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first food item.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Food Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddFoodItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFoodItemAdded={handleFoodItemAdded}
      />
    </div>
  );
} 