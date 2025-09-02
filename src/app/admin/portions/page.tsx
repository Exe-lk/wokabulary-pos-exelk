"use client";

import { useState, useEffect } from "react";
import AddPortionModal from "@/components/AddPortionModal";
import { showErrorAlert, showConfirmDialog } from "@/lib/sweetalert";

interface Portion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PortionsPage() {
  const [portions, setPortions] = useState<Portion[]>([]);
  const [filteredPortions, setFilteredPortions] = useState<Portion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchPortions = async () => {
    try {
      const response = await fetch('/api/admin/portions');
      if (!response.ok) {
        throw new Error('Failed to fetch portions');
      }
      const data = await response.json();
      setPortions(data);
      setFilteredPortions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortions();
  }, []);

  // Filter portions based on search term
  useEffect(() => {
    const filtered = portions.filter(portion =>
      portion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (portion.description && portion.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPortions(filtered);
  }, [searchTerm, portions]);

  const handlePortionAdded = () => {
    fetchPortions();
  };

  const handleToggleStatus = async (portionId: string) => {
    try {
      const portion = portions.find(p => p.id === portionId);
      if (!portion) return;

      const response = await fetch(`/api/admin/portions/${portionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !portion.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          const action = portion.isActive ? 'disable' : 'enable';
          showErrorAlert(
            `Cannot ${action} portion "${portion.name}"`,
            `Affected food items: ${errorData.affectedItems.join(', ')}\n\n${errorData.error}`
          );
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to update portion status');
        }
        
        throw new Error(errorData.error || 'Failed to update portion status');
      }

      // Update local state
      setPortions(prevPortions =>
        prevPortions.map(port =>
          port.id === portionId ? { ...port, isActive: !port.isActive } : port
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePortion = async (portionId: string) => {
    const portion = portions.find(p => p.id === portionId);
    if (!portion) return;

    const result = await showConfirmDialog(
      'Delete Portion',
      `Are you sure you want to delete the portion "${portion.name}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );
    
    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/portions/${portionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          showErrorAlert(
            `Cannot delete portion "${portion.name}"`,
            `Affected food items: ${errorData.affectedItems.join(', ')}\n\n${errorData.error}`
          );
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to delete portion');
        }
        
        throw new Error(errorData.error || 'Failed to delete portion');
      }

      // Remove from local state
      setPortions(prevPortions =>
        prevPortions.filter(port => port.id !== portionId)
      );
    } catch (err: any) {
      setError(err.message);
    }
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
          <p className="text-gray-600">Loading Portions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Portion Sizes</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Portion
            </button>
          </div>

          {/* Search Bar */}
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search portions by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {filteredPortions.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No portions found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No portions</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new portion size.</p>
                  {/* <div className="mt-6">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Portion
                    </button>
                  </div> */}
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Portion Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
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
                  {filteredPortions.map((portion) => (
                    <tr key={portion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{portion.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {portion.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          portion.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {portion.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(portion.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleToggleStatus(portion.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              portion.isActive
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {portion.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeletePortion(portion.id)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
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
          )}
        </div>
      </div>

      <AddPortionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPortionAdded={handlePortionAdded}
      />
    </div>
  );
} 