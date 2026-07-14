/**
 * ProductManager Component
 * 
 * Feature 7 Completion: Manage event merchandise
 * Create and manage products for sale at events
 */

import React, { useState } from 'react';
import { Plus, Package, DollarSign, Upload, Trash2 } from 'lucide-react';

interface ProductVariant {
    id: string;
    sku: string;
    name: string;
    attributes: {
        size?: string;
        color?: string;
    };
    priceAdjustment: number;
    stock: number;
    available: boolean;
}

interface Product {
    id: string;
    name: string;
    description: string;
    category: string;
    basePrice: number;
    hasVariants: boolean;
    variants: ProductVariant[];
    trackInventory: boolean;
    totalStock: number;
    requiresShipping: boolean;
    available: boolean;
}

export default function ProductManager({ eventId }: { eventId: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'apparel',
        basePrice: 0,
        hasVariants: false,
        trackInventory: true,
        totalStock: 0,
        requiresShipping: true
    });

    const createProduct = async () => {
        const productData = {
            eventId,
            ...formData,
            variants: [],
            images: [],
            primaryImage: '',
            lowStockThreshold: 10,
            available: true,
            stats: {
                totalSold: 0,
                totalRevenue: 0
            },
            currency: 'USD'
        };

        const response = await fetch('/api/merchandising/create-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Product created!');
            setShowModal(false);
            // Reset form and refresh
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Event Merchandise</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {/* Create Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Create Product</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Event T-Shirt"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="apparel">Apparel</option>
                                        <option value="accessories">Accessories</option>
                                        <option value="books">Books</option>
                                        <option value="digital">Digital Downloads</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Base Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Initial Stock
                                </label>
                                <input
                                    type="number"
                                    value={formData.totalStock}
                                    onChange={(e) => setFormData({ ...formData, totalStock: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.hasVariants}
                                        onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Has Variants (sizes/colors)</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.requiresShipping}
                                        onChange={(e) => setFormData({ ...formData, requiresShipping: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Requires Shipping</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createProduct}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                            <Package size={64} className="text-gray-400" />
                        </div>

                        <div className="p-4">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>

                            <div className="flex items-center justify-between mt-4">
                                <span className="text-2xl font-bold text-indigo-600">
                                    ${product.basePrice}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {product.totalStock} in stock
                                </span>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                                    Edit
                                </button>
                                <button className="px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Package size={64} className="mx-auto mb-4 opacity-50" />
                        <p>No products yet</p>
                        <p className="text-sm">Add your first product to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
