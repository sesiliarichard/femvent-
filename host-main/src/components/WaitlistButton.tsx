import React, { useState } from 'react';

interface WaitlistButtonProps {
    eventId: string;
    eventTitle: string;
    isSoldOut: boolean;
    className?: string;
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({
    eventId,
    eventTitle,
    isSoldOut,
    className = '',
}) => {
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    const handleJoinWaitlist = async () => {
        setIsJoining(true);
        try {
            const response = await fetch(`/api/events/${eventId}/waitlist/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const { position } = await response.json();
                setHasJoined(true);
                alert(`✅ You're on the waitlist!\n\nPosition: #${position}\n\nWe'll notify you by email when a spot opens up.`);
            } else {
                const error = await response.json();
                alert(`Failed to join waitlist: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            alert('An error occurred while joining the waitlist');
        } finally {
            setIsJoining(false);
        }
    };

    if (!isSoldOut) return null;

    if (hasJoined) {
        return (
            <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-semibold text-green-900">You're on the waitlist!</p>
                        <p className="text-sm text-green-700">We'll email you when a spot opens.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-bold text-orange-900">Event Sold Out</p>
                    </div>
                    <p className="text-sm text-orange-800 mb-3">
                        This event is currently full, but you can join the waitlist to be notified if spots become available.
                    </p>
                    <button
                        onClick={handleJoinWaitlist}
                        disabled={isJoining}
                        className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isJoining ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Joining...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Join Waitlist</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="text-right">
                    <div className="bg-orange-100 px-3 py-1 rounded-full">
                        <p className="text-xs font-semibold text-orange-900">FREE</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitlistButton;
