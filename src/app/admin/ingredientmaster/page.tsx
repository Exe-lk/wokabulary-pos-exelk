"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIngredientMaster from "@/components/AddIngredientMaster";
import EditIngredientMaster from "@/components/EditIngredientMaster";
import AddStockModal from "@/components/AddStockModal";

interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unitOfMeasurement: string;
  currentStockQuantity: number;
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

  const handleAddStock = (ingredient: Ingredient) => {
    setAddingStockTo(ingredient);
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
          alert(`Cannot ${action} ingredient "${ingredient.name}".\n\nAffected items: ${errorData.affectedItems.join(', ')}\n\n${errorData.error}`);
        } else {
          alert(errorData.error || 'Failed to update ingredient status');
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

    if (!confirm(`Are you sure you want to delete the ingredient "${ingredient.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          alert(`Cannot delete ingredient "${ingredient.name}".\n\nAffected items: ${errorData.affectedItems.join(', ')}\n\n${errorData.error}`);
        } else {
          alert(errorData.error || 'Failed to delete ingredient');
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
                        <div className="text-sm text-gray-900">
                          {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}
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