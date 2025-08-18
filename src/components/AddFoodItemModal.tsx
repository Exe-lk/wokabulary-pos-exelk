"use client";

import { useState, useEffect } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';

interface AddFoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodItemAdded: () => void;
}

interface FoodItemFormData {
  name: string;
  description: string;
  categoryId: string;
}

interface PortionPrice {
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

export default function AddFoodItemModal({ isOpen, onClose, onFoodItemAdded }: AddFoodItemModalProps) {
  const [formData, setFormData] = useState<FoodItemFormData>({
    name: "",
    description: "",
    categoryId: "",
  });
  const [portionPrices, setPortionPrices] = useState<PortionPrice[]>([{ portionId: "", price: "" }]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");

  // Fetch portions and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPortions();
      fetchCategories();
    }
  }, [isOpen]);

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
    if (portionPrices.length > 1) {
      const newPortionPrices = portionPrices.filter((_, i) => i !== index);
      setPortionPrices(newPortionPrices);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setIsUploadingImage(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedImage);

      // Upload via server-side endpoint
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.name || !formData.categoryId) {
        throw new Error('Name and category are required');
      }

      // Validate portion prices
      const validPortionPrices = portionPrices.filter(pp => pp.portionId && pp.price);
      if (validPortionPrices.length === 0) {
        throw new Error('At least one portion with price is required');
      }

      // Check for duplicate portions
      const portionIds = validPortionPrices.map(pp => pp.portionId);
      const uniquePortionIds = new Set(portionIds);
      if (portionIds.length !== uniquePortionIds.size) {
        throw new Error('Duplicate portions are not allowed');
      }

      // Validate prices
      for (const pp of validPortionPrices) {
        const price = parseFloat(pp.price);
        if (isNaN(price) || price <= 0) {
          throw new Error('All prices must be valid positive numbers');
        }
      }

      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // Create food item with portions
      const response = await fetch('/api/admin/food-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          portions: validPortionPrices.map(pp => ({
            portionId: pp.portionId,
            price: parseFloat(pp.price)
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create food item');
      }

      // Reset form and close modal
      resetForm();
      onFoodItemAdded();
      onClose();
      showSuccessAlert('Food item created successfully!');

    } catch (err: any) {
      setError(err.message || "Failed to create food item");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
    });
    setPortionPrices([{ portionId: "", price: "" }]);
    setSelectedImage(null);
    setImagePreview(null);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAvailablePortions = (currentIndex: number) => {
    const usedPortionIds = portionPrices
      .map((pp, index) => index !== currentIndex ? pp.portionId : null)
      .filter(Boolean);
    return portions.filter(portion => !usedPortionIds.includes(portion.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Food Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Food Item Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Margherita Pizza"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe the food item..."
            />
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.description && `- ${category.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Portion Sizes and Prices */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Portion Sizes & Prices *
              </label>
              <button
                type="button"
                onClick={addPortionPrice}
                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-md hover:bg-purple-200 transition-colors"
              >
                + Add Portion
              </button>
            </div>
            
            <div className="space-y-3">
              {portionPrices.map((portionPrice, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <select
                      value={portionPrice.portionId}
                      onChange={(e) => handlePortionPriceChange(index, 'portionId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select portion</option>
                      {getAvailablePortions(index).map((portion) => (
                        <option key={portion.id} value={portion.id}>
                          {portion.name} {portion.description && `- ${portion.description}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={portionPrice.price}
                      onChange={(e) => handlePortionPriceChange(index, 'price', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Price ($)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  {portionPrices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePortionPrice(index)}
                      className="text-red-600 hover:text-red-800 p-1"
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

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
            </p>
            
            {imagePreview && (
              <div className="mt-3">
                <p className="text-sm text-gray-700 mb-2">Image Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploadingImage ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isUploadingImage ? 'Uploading...' : 'Creating...'}
                </div>
              ) : (
                "Add Food Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 