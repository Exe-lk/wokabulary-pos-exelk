"use client";

import { useState, useEffect } from "react";
import AddFoodItemModal from "@/components/AddFoodItemModal";
import EditFoodItemModal from "@/components/EditFoodItemModal";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { showErrorAlert } from "@/lib/sweetalert";

interface FoodItemPortionIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient: {
    id: string;
    name: string;
    unitOfMeasurement: string;
  };
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
  ingredients: FoodItemPortionIngredient[];
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
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  const fetchFoodItems = async () => {
    try {
      const response = await fetch('/api/admin/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    const filtered = items.filter(item => {
      const searchLower = searchTerm.toLowerCase();

      // Search in item name
      if (item.name.toLowerCase().includes(searchLower)) return true;

      // Search in item description
      if (item.description && item.description.toLowerCase().includes(searchLower)) return true;

      // Search in category name
      if (item.category.name.toLowerCase().includes(searchLower)) return true;

      // Search in category description
      if (item.category.description && item.category.description.toLowerCase().includes(searchLower)) return true;

      // Search in portion names
      if (item.foodItemPortions.some(portion =>
        portion.portion.name.toLowerCase().includes(searchLower) ||
        (portion.portion.description && portion.portion.description.toLowerCase().includes(searchLower))
      )) return true;

      // Search in prices (convert price to string for searching)
      if (item.foodItemPortions.some(portion =>
        portion.price.toString().includes(searchLower) ||
        formatPrice(portion.price).toLowerCase().includes(searchLower)
      )) return true;

      return false;
    });
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleFoodItemAdded = () => {
    fetchFoodItems();
  };

  const handleFoodItemUpdated = () => {
    fetchFoodItems();
  };

  const handleEditItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const response = await fetch(`/api/admin/food-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedOrders) {
          const action = item.isActive ? 'disable' : 'enable';
          const orderList = errorData.affectedOrders
            .map((order: any) => `Order #${order.orderId} (Table ${order.tableNumber}, Status: ${order.status})`)
            .join('\n');
          showErrorAlert(
            `Cannot ${action} food item "${item.name}"`,
            `Affected incomplete orders:\n${orderList}\n\n${errorData.error}`
          );
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to update item availability');
        }
        
        throw new Error(errorData.error || 'Failed to update item availability');
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
    return `Rs. ${price.toLocaleString('en-LK')}`;
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

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Food Items...</p>
        </div>
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
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Food Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search by name, category, portion, or price..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
                     <table className="w-full table-fixed">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/4">Item</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/8">Category</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/3">Portions, Prices & Ingredients</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/8">Price Range</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/12">Status</th>
                 <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/8">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                                     <td className="py-4 px-4">
                     <div className="flex items-start">
                       {item.imageUrl && (
                         <img
                           src={item.imageUrl}
                           alt={item.name}
                           className="w-12 h-12 rounded-lg object-cover mr-3 flex-shrink-0"
                         />
                       )}
                       <div className="min-w-0 flex-1">
                         <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                                   {item.description && (
                            <p 
                              className="text-sm text-gray-500 mt-1 break-words line-clamp-2 cursor-help"
                              title={item.description}
                            >
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
                    <div className="space-y-2">
                      {item.foodItemPortions.map((portion) => (
                        <div key={portion.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">{portion.portion.name}</span>
                            <span className="text-blue-600 font-medium">
                              {formatPrice(portion.price)}
                            </span>
                          </div>
                          {portion.ingredients && portion.ingredients.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              <span className="font-medium">Ingredients:</span>
                              <div className="ml-2 space-y-0.5">
                                {portion.ingredients.map((ing) => (
                                  <div key={ing.id} className="flex items-center justify-between">
                                    <span>{ing.ingredient.name}</span>
                                    <span className="text-gray-400">
                                      {ing.quantity} {ing.ingredient.unitOfMeasurement}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive
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
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex items-center gap-1 text-sm font-medium ${item.isActive
                            ? "text-red-600 hover:text-red-800"
                            : "text-green-600 hover:text-green-800"
                          }`}
                      >
                        {item.isActive ? (
                          <>
                            <FaTimesCircle className="text-red-600" />
                            Disable
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="text-green-600" />
                            Enable
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
                </>
              ) : (
                <>
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
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors"
                    >
                      Add Food Item
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AddFoodItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFoodItemAdded={handleFoodItemAdded}
      />

      <EditFoodItemModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        foodItem={selectedItem}
        onFoodItemUpdated={handleFoodItemUpdated}
      />
    </div>
  );
} 