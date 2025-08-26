"use client";

import { useState, useEffect } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';

interface EditFoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  onFoodItemUpdated: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  foodItemPortions: FoodItemPortion[];
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
}

interface FoodItemFormData {
  name: string;
  description: string;
  categoryId: string;
}

interface PortionPrice {
  id?: string;
  portionId: string;
  price: string;
}

interface Portion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export default function EditFoodItemModal({ isOpen, onClose, foodItem, onFoodItemUpdated }: EditFoodItemModalProps) {
  const [formData, setFormData] = useState<FoodItemFormData>({
    name: "",
    description: "",
    categoryId: "",
  });
  const [portionPrices, setPortionPrices] = useState<PortionPrice[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when foodItem changes
  useEffect(() => {
    if (foodItem && isOpen) {
      setFormData({
        name: foodItem.name,
        description: foodItem.description || "",
        categoryId: foodItem.categoryId,
      });
      
      // Convert existing portions to form format
      const existingPortions = foodItem.foodItemPortions.map(fp => ({
        id: fp.id,
        portionId: fp.portionId,
        price: fp.price.toString(),
      }));
      setPortionPrices(existingPortions);
      
      // Set image preview
      setImagePreview(foodItem.imageUrl);
      
      // Fetch portions and categories
      fetchPortions();
      fetchCategories();
    }
  }, [foodItem, isOpen]);

  const fetchPortions = async () => {
    try {
      const response = await fetch('/api/admin/portions');
      if (!response.ok) {
        throw new Error('Failed to fetch portions');
      }
      const data = await response.json();
      setPortions(data.filter((portion: Portion) => portion.isActive));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.filter((category: Category) => category.isActive));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePortionPriceChange = (index: number, field: 'portionId' | 'price', value: string) => {
    const newPortionPrices = [...portionPrices];
    newPortionPrices[index] = { ...newPortionPrices[index], [field]: value };
    setPortionPrices(newPortionPrices);
  };

  const addPortionPrice = () => {
    setPortionPrices([...portionPrices, { portionId: "", price: "" }]);
  };

  const removePortionPrice = (index: number) => {
    const newPortionPrices = portionPrices.filter((_, i) => i !== index);
    setPortionPrices(newPortionPrices);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodItem) return;

    setIsLoading(true);
    setError("");

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Food item name is required');
      }
      if (!formData.categoryId) {
        throw new Error('Category is required');
      }
      if (portionPrices.length === 0) {
        throw new Error('At least one portion and price is required');
      }

      // Validate portion prices
      const validPortionPrices = portionPrices.filter(pp => pp.portionId && pp.price);
      if (validPortionPrices.length === 0) {
        throw new Error('At least one valid portion and price is required');
      }

      // Upload image if selected
      let imageUrl = foodItem.imageUrl;
      if (selectedImage) {
        setIsUploadingImage(true);
        imageUrl = await uploadImage(selectedImage);
        setIsUploadingImage(false);
      }

      // Prepare data for API
      const updateData = {
        id: foodItem.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: formData.categoryId,
        imageUrl,
        portions: validPortionPrices.map(pp => ({
          id: pp.id, // Include existing ID for updates
          portionId: pp.portionId,
          price: parseFloat(pp.price),
        })),
      };

      const response = await fetch('/api/admin/food-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update food item');
      }

      showSuccessAlert('Food item updated successfully!');
      onFoodItemUpdated();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
    });
    setPortionPrices([]);
    setSelectedImage(null);
    setImagePreview(null);
    setError("");
    onClose();
  };

  if (!isOpen || !foodItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Food Item</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Food Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter food item name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Image</h3>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Portions and Prices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Portions & Prices *</h3>
                <button
                  type="button"
                  onClick={addPortionPrice}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Portion
                </button>
              </div>
              <div className="space-y-3">
                {portionPrices.map((portionPrice, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <select
                      value={portionPrice.portionId}
                      onChange={(e) => handlePortionPriceChange(index, 'portionId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select portion</option>
                      {portions.map((portion) => (
                        <option key={portion.id} value={portion.id}>
                          {portion.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={portionPrice.price}
                      onChange={(e) => handlePortionPriceChange(index, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {portionPrices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortionPrice(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Food Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 