import React, { useState } from 'react';

interface BulkSMSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
    recipientCount: number;
}

const BulkSMSModal: React.FC<BulkSMSModalProps> = ({
    isOpen,
    onClose,
    onSend,
    recipientCount,
}) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const maxLength = 160;
    const remainingChars = maxLength - message.length;

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }

        if (message.length > maxLength) {
            alert(`Message is too long. Maximum ${maxLength} characters.`);
            return;
        }

        setSending(true);
        try {
            await onSend(message.trim());
            setMessage('');
            onClose();
        } catch (error) {
            console.error('Error sending SMS:', error);
            alert('Failed to send SMS messages');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Send Bulk SMS</h3>
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
                    {/* Message */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="smsMessage" className="block text-sm font-medium text-gray-700">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs ${remainingChars < 20 ? 'text-red-600' : 'text-gray-500'}`}>
                                {remainingChars} / {maxLength} characters
                            </span>
                        </div>
                        <textarea
                            id="smsMessage"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your SMS message..."
                            rows={4}
                            maxLength={maxLength}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            disabled={sending}
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex">
                            <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">SMS Best Practices:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Keep messages concise and clear</li>
                                    <li>Include event name and key details</li>
                                    <li>SMS charges may apply per recipient</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm text-gray-900">{message || 'Your message will appear here...'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        disabled={sending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !message.trim() || message.length > maxLength}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span>Send SMS to {recipientCount}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkSMSModal;
