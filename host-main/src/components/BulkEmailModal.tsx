import React, { useState } from 'react';
import { emailTemplates, EmailTemplate, EmailTemplateData } from '../lib/emailTemplates';

interface BulkEmailModalWithTemplatesProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (emailData: { subject: string; body: string; html?: string }) => Promise<void>;
    recipientCount: number;
}

const BulkEmailModalWithTemplates: React.FC<BulkEmailModalWithTemplatesProps> = ({
    isOpen,
    onClose,
    onSend,
    recipientCount,
}) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    if (!isOpen) return null;

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);

        if (templateId === 'none') {
            setSubject('');
            setBody('');
            return;
        }

        const template = emailTemplates.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            // Set a sample body for custom templates
            if (templateId === 'custom-announcement') {
                setBody('Your custom message here...');
            } else {
                setBody('');
            }
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || (!body.trim() && selectedTemplate === 'none')) {
            alert('Please fill in both subject and message');
            return;
        }

        setSending(true);
        try {
            // If using a template, pass the template ID
            await onSend({
                subject: subject.trim(),
                body: body.trim(),
                html: selectedTemplate !== 'none' ? selectedTemplate : undefined,
            });
            setSubject('');
            setBody('');
            setSelectedTemplate('none');
            onClose();
        } catch (error) {
            console.error('Error sending emails:', error);
            alert('Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Send Bulk Email</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Sending to {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={sending}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Template Selection */}
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                            📧 Email Template
                        </label>
                        <select
                            id="template"
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={sending}
                        >
                            <option value="none">Plain Text (No Template)</option>
                            {emailTemplates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                        {selectedTemplate !== 'none' && (
                            <p className="mt-1 text-xs text-blue-600">
                                ✨ Using professional HTML template with branded styling
                            </p>
                        )}
                    </div>

                    {/* Subject */}
                    <div>
                        <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 mb-1">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="emailSubject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={sending}
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700 mb-1">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="emailBody"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder={selectedTemplate !== 'none' ? "This will be formatted with the selected template..." : "Enter your message..."}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            disabled={sending}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Variables: {'{{name}}'}, {'{{event}}'}, {'{{date}}'}
                        </p>
                    </div>

                    {/* Template Info */}
                    {selectedTemplate !== 'none' && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Professional Email Template Selected</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Responsive design for all devices</li>
                                        <li>Branded colors and styling</li>
                                        <li>Professional layout with event card</li>
                                        <li>Call-to-action buttons</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center sticky bottom-0">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {showPreview ? '📧 Hide' : '👁️ Preview'}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                            disabled={sending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending || !subject.trim() || !body.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Sending to {recipientCount}...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Send Email</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkEmailModalWithTemplates;
