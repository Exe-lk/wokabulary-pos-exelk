"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIngredientMaster from "@/components/AddIngredientMaster";
import EditIngredientMaster from "@/components/EditIngredientMaster";
import AddStockModal from "@/components/AddStockModal";
import { showCustomAlert, showErrorAlert, showConfirmDialog } from '@/lib/sweetalert';
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

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManageCategories() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [addingStockTo, setAddingStockTo] = useState<Ingredient | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedAdmin) {
      router.push('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(storedAdmin);
      setAdminUser(admin);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push('/admin/login');
    }
  }, [router]);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await response.json();
      setIngredients(data);
      setFilteredIngredients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Filter ingredients based on search term
  useEffect(() => {
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ingredient.description && ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ingredient.unitOfMeasurement.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const handleAddIngredient = () => {
    setIsAddModalOpen(true);
  };

  const handleIngredientAdded = () => {
    fetchIngredients();
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  const handleAddStock = async (ingredient: Ingredient) => {
    // Show warning if ingredient is below reorder level
    if (ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive) {
      const result = await showCustomAlert({
        title: 'Low Stock Warning',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${ingredient.name}</strong> is currently below its reorder level.</p>
            <p class="text-sm text-gray-600">Current: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}</p>
            <p class="text-sm text-gray-600">Reorder Level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continue Adding Stock',
        cancelButtonText: 'Cancel'
      });
      
      if (result.isConfirmed) {
        setAddingStockTo(ingredient);
      }
    } else {
      setAddingStockTo(ingredient);
    }
  };

  const handleToggleStatus = async (ingredientId: string) => {
    try {
      const ingredient = ingredients.find(c => c.id === ingredientId);
      if (!ingredient) return;

      const response = await fetch(`/api/admin/ingredients/${ingredientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !ingredient.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          const action = ingredient.isActive ? 'disable' : 'enable';
          showCustomAlert({
            title: `Cannot ${action.charAt(0).toUpperCase() + action.slice(1)} Ingredient`,
            html: `
              <div class="text-left">
                <p class="mb-2">Cannot ${action} ingredient <strong>"${ingredient.name}"</strong>.</p>
                <p class="text-sm text-gray-600 mb-2">Affected items: ${errorData.affectedItems.join(', ')}</p>
                <p class="text-sm text-gray-600">${errorData.error}</p>
              </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to update ingredient status');
        }
        
        throw new Error(errorData.error || 'Failed to update ingredient status');
      }

      // Update local state
      setIngredients(prevIngredients =>
        prevIngredients.map(ing =>
          ing.id === ingredientId ? { ...ing, isActive: !ing.isActive } : ing
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    const ingredient = ingredients.find(c => c.id === ingredientId);
    if (!ingredient) return;

    // Check if ingredient is below reorder level and show special warning
    if (ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive) {
      const result = await Swal.fire({
        title: 'Delete Low Stock Ingredient?',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${ingredient.name}</strong> is currently below its reorder level.</p>
            <p class="text-sm text-gray-600 mb-3">Current: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}</p>
            <p class="text-sm text-gray-600 mb-3">Reorder Level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
            <p class="text-red-600 font-medium">Are you sure you want to delete this ingredient?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        background: '#fef2f2',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-red-800 font-semibold',
          htmlContainer: 'text-red-700'
        }
      });
      
      if (!result.isConfirmed) {
        return;
      }
    } else {
      // Regular confirmation for normal ingredients
      const result = await showConfirmDialog(
        'Delete Ingredient?',
        `Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`,
        'Yes, Delete',
        'Cancel'
      );
      
      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          showCustomAlert({
            title: 'Cannot Delete Ingredient',
            html: `
              <div class="text-left">
                <p class="mb-2">Cannot delete ingredient <strong>"${ingredient.name}"</strong>.</p>
                <p class="text-sm text-gray-600 mb-2">Affected items: ${errorData.affectedItems.join(', ')}</p>
                <p class="text-sm text-gray-600">${errorData.error}</p>
              </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to delete ingredient');
        }
        
        throw new Error(errorData.error || 'Failed to delete ingredient');
      }

      // Remove from local state
      setIngredients(prevIngredients =>
        prevIngredients.filter(ing => ing.id !== ingredientId)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check for low stock alerts
  const getLowStockIngredients = () => {
    return ingredients.filter(ingredient => 
      ingredient.isActive && 
      ingredient.currentStockQuantity < ingredient.reorderLevel
    );
  };

  const lowStockIngredients = getLowStockIngredients();

  // Show alert for low stock items when data is loaded
  useEffect(() => {
    if (!isLoading && lowStockIngredients.length > 0) {
      const ingredientList = lowStockIngredients.map(ing => 
        `<li><strong>${ing.name}</strong>: ${ing.currentStockQuantity} ${ing.unitOfMeasurement} (Reorder level: ${ing.reorderLevel} ${ing.unitOfMeasurement})</li>`
      ).join('');
      
      showCustomAlert({
        title: 'Low Stock Alert!',
        html: `
          <div class="text-left">
            <p class="mb-3">${lowStockIngredients.length} ingredient${lowStockIngredients.length > 1 ? 's' : ''} need${lowStockIngredients.length > 1 ? '' : 's'} to be reordered:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              ${ingredientList}
            </ul>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }, [isLoading, lowStockIngredients]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ingredients...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Food Ingredients</h2>
              <button
                onClick={handleAddIngredient}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors"
              >
                Add Ingredient
              </button>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Low Stock Alert */}
          {lowStockIngredients.length > 0 && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Low Stock Alert ({lowStockIngredients.length} ingredient{lowStockIngredients.length > 1 ? 's' : ''})
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <ul className="list-disc list-inside space-y-1">
                      {lowStockIngredients.map((ingredient) => (
                        <li key={ingredient.id}>
                          <strong>{ingredient.name}</strong>: {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement} 
                          (Reorder level: {ingredient.reorderLevel} {ingredient.unitOfMeasurement})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit of Measurement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIngredients.map((ingredient) => (
                    <tr key={ingredient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {ingredient.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ingredient.unitOfMeasurement}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium flex items-center ${
                          ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive && (
                            <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ingredient.reorderLevel} {ingredient.unitOfMeasurement}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ingredient.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ingredient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ingredient.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddStock(ingredient)}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Add Stock
                          </button>
                          <button
                            onClick={() => handleEditIngredient(ingredient)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(ingredient.id)}
                            className={`mr-2 ${
                              ingredient.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {ingredient.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ingredient.id)}
                            className="text-red-600 hover:text-red-900"
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

            {filteredIngredients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No ingredients found.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <AddIngredientMaster
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onIngredientAdded={handleIngredientAdded}
        />
      )}

      {/* Edit Ingredient Modal */}
      {editingIngredient && (
        <EditIngredientMaster
          isOpen={!!editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onIngredientUpdated={handleIngredientAdded}
          ingredient={editingIngredient}
        />
      )}

      {/* Add Stock Modal */}
      {addingStockTo && (
        <AddStockModal
          isOpen={!!addingStockTo}
          onClose={() => setAddingStockTo(null)}
          onStockAdded={handleIngredientAdded}
          ingredient={addingStockTo}
        />
      )}
    </div>
  );
} 