import React from 'react';
import { useRouter } from 'next/router';

interface TemplateCardProps {
    template: {
        id: string;
        name: string;
        description?: string;
        category: string;
        title: string;
        capacity: number;
        price: number;
        currency: string;
        usageCount: number;
        createdAt: string;
    };
    onUse: (templateId: string) => void;
    onEdit: (templateId: string) => void;
    onDelete: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{template.name}</h3>
                        {template.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                        )}
                    </div>
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.category}
                    </span>
                </div>

                {/* Template Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-medium">{template.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            <span className="font-medium">Capacity:</span> {template.capacity}
                        </span>
                        <span className="text-gray-900 font-semibold">
                            {template.price > 0 ? `${template.currency}${template.price}` : 'Free'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                        Used {template.usageCount} {template.usageCount === 1 ? 'time' : 'times'}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => onUse(template.id)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                        Use Template
                    </button>
                    <button
                        onClick={() => onEdit(template.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(template.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
