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

  const handleDeleteItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Delete Item?',
      text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/food-items/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete item');
        }

        await Swal.fire({
          title: 'Deleted!',
          text: 'Item has been deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        fetchFoodItems();
      } catch (err: any) {
        await Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to delete item.',
          icon: 'error',
        });
      }
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Food Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Food Items</h2>
                <div className="text-sm text-gray-500">
                  {filteredItems.length === 0 
                    ? 'No items found' 
                    : `Showing ${filteredItems.length} of ${items.length} items`
                  }
                  {searchTerm && (
                    <span className="ml-2">
                      for "<span className="font-medium">{searchTerm}</span>"
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portions & Prices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.imageUrl && (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {!item.imageUrl && (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white font-semibold text-sm">
                                {item.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs" title={item.description}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {item.foodItemPortions.map((portion) => (
                            <div key={portion.id} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{portion.portion.name}</span>
                              <span className="text-sm font-medium text-blue-600">
                                {formatPrice(portion.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {getPriceRange(item.foodItemPortions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Food Items Found</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No items match "${searchTerm}". Try adjusting your search.`
                    : 'Food items will appear here when they are added.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
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
    </div>
  );
} 