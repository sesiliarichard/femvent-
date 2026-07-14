import React, { useState } from 'react';

interface SaveAsTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (templateData: { name: string; description: string }) => Promise<void>;
    eventData: any;
}

const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    eventData,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a template name');
            return;
        }

        setSaving(true);
        try {
            await onSave({ name: name.trim(), description: description.trim() });
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={saving}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Save this event configuration as a template for quick event creation in the future.
                    </p>

                    {/* Template Name */}
                    <div>
                        <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="templateName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Monthly Networking Event"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={saving}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="templateDesc" className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            id="templateDesc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of when to use this template..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            disabled={saving}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                            <strong>What will be saved:</strong> Title, category, location, capacity, pricing, ticket types, agenda, and requirements.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : (
                            'Save Template'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveAsTemplateModal;
