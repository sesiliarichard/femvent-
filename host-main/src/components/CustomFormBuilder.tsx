/**
 * CUSTOM FORMS BUILDER
 * Create custom registration fields for events
 */

export interface CustomField {
    id: string;
    type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date';
    label: string;
    required: boolean;
    options?: string[]; // For select fields
    placeholder?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    conditional?: {
        field: string;
        value: any;
    };
}

export interface CustomForm {
    id: string;
    eventId: string;
    fields: CustomField[];
    createdAt: Date;
    updatedAt: Date;
}

import React, { useState } from 'react';

interface CustomFormBuilderProps {
    eventId: string;
    onSave: (fields: CustomField[]) => void;
}

const CustomFormBuilder: React.FC<CustomFormBuilderProps> = ({ eventId, onSave }) => {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [editingField, setEditingField] = useState<CustomField | null>(null);

    const fieldTypes = [
        { value: 'text', label: 'Short Text' },
        { value: 'textarea', label: 'Long Text' },
        { value: 'email', label: 'Email' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'select', label: 'Dropdown' },
        { value: 'checkbox', label: 'Checkbox' },
    ];

    const addField = (type: string) => {
        const newField: CustomField = {
            id: `field_${Date.now()}`,
            type: type as any,
            label: 'New Field',
            required: false,
        };
        setFields([...fields, newField]);
        setEditingField(newField);
    };

    const updateField = (id: string, updates: Partial<CustomField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < fields.length) {
            [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
            setFields(newFields);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Custom Registration Fields</h3>

            {/* Add Field Buttons */}
            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Add fields to collect additional information:</p>
                <div className="flex flex-wrap gap-2">
                    {fieldTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => addField(type.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            + {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fields List */}
            {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500border border-dashed border-gray-300 rounded-lg">
                    <p>No custom fields yet. Click above to add fields.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                                        className="font-medium text-gray-900 border-none focus:outline-none"
                                        placeholder="Field Label"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Type: {field.type}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => moveField(index, 'up')}
                                        disabled={index === 0}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveField(index, 'down')}
                                        disabled={index === fields.length - 1}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => removeField(field.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    className="rounded"
                                />
                                Required field
                            </label>

                            {field.type === 'select' && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-1">Options (one per line):</p>
                                    <textarea
                                        value={field.options?.join('\n') || ''}
                                        onChange={(e) => updateField(field.id, { options: e.target.value.split('\n') })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        rows={3}
                                        placeholder="Option 1\nOption 2\nOption 3"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Save Button */}
            {fields.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => onSave(fields)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save Custom Fields
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomFormBuilder;
