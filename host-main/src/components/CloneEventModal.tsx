import React, { useState } from 'react';

interface CloneEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
    onCloneSuccess: (newEventId: string) => void;
}

const CloneEventModal: React.FC<CloneEventModalProps> = ({
    isOpen,
    onClose,
    eventId,
    eventTitle,
    onCloneSuccess,
}) => {
    const [cloning, setCloning] = useState(false);
    const [options, setOptions] = useState({
        copyAttendees: false,
        editBeforePublish: true,
        publishImmediately: false,
    });
    const [newTitle, setNewTitle] = useState(`${eventTitle} (Copy)`);

    const handleClone = async () => {
        setCloning(true);
        try {
            console.log('Starting clone process...');
            console.log('Event ID:', eventId);
            console.log('New title:', newTitle);

            const { supabase } = await import('../lib/supabase');

            // Fetch the original event
            console.log('Fetching event from Supabase...');
            const { data: originalEvent, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (fetchError || !originalEvent) {
                alert('Event not found');
                return;
            }

            console.log('Original event fetched:', originalEvent.title);

            // Create cloned event
            console.log('Creating cloned event in Supabase...');
            const { data: newEvent, error: insertError } = await supabase
                .from('events')
                .insert({
                    title: newTitle.trim(),
                    description: originalEvent.description,
                    location: originalEvent.location,
                    event_date: originalEvent.event_date,
                    category: originalEvent.category,
                    price: originalEvent.price,
                    capacity: originalEvent.capacity,
                    image_url: originalEvent.image_url,
                    poster_url: originalEvent.poster_url,
                    host_id: originalEvent.host_id,
                    status: options.editBeforePublish ? 'draft' : 'published',
                    tickets_sold: 0,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            const newEventId = newEvent.id;

            console.log('✅ Clone successful! New event ID:', newEventId);
            alert(`✅ Event cloned successfully!`);
            onCloneSuccess(newEventId);
            onClose();
        } catch (error: any) {
            console.error('❌ Clone error:', error);
            alert(`Failed to clone event:\n\n${error.message}\n\nMake sure you're logged in and have permissions.`);
        } finally {
            setCloning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Clone Event</h3>
                                <p className="text-sm text-gray-600">Duplicate event settings</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={cloning}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* New Event Title */}
                    <div>
                        <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            New Event Title
                        </label>
                        <input
                            type="text"
                            id="newTitle"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={cloning}
                            placeholder="Enter new event title..."
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Clone Options</p>

                        {/* Copy Attendees */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={options.copyAttendees}
                                onChange={(e) => setOptions({ ...options, copyAttendees: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={cloning}
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                    Copy Attendees
                                </span>
                                <p className="text-xs text-gray-500">Include current attendees in the new event</p>
                            </div>
                        </label>

                        {/* Edit Before Publish */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={options.editBeforePublish}
                                onChange={(e) => setOptions({
                                    ...options,
                                    editBeforePublish: e.target.checked,
                                    publishImmediately: !e.target.checked ? options.publishImmediately : false
                                })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={cloning}
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                    Edit Before Publishing
                                </span>
                                <p className="text-xs text-gray-500">Review and modify event details before going live</p>
                            </div>
                        </label>

                        {/* Publish Immediately */}
                        {!options.editBeforePublish && (
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={options.publishImmediately}
                                    onChange={(e) => setOptions({ ...options, publishImmediately: e.target.checked })}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={cloning}
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                        Publish Immediately
                                    </span>
                                    <p className="text-xs text-gray-500">Make the cloned event live right away</p>
                                </div>
                            </label>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">What gets cloned:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-xs">
                                    <li>Event details & description</li>
                                    <li>Pricing & ticket types</li>
                                    <li>Venue & location</li>
                                    <li>Images & media</li>
                                    <li>Settings & preferences</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        disabled={cloning}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={cloning || !newTitle.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {cloning ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Cloning...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Clone Event</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloneEventModal;
