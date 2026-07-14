/**
 * SeatSelector Component
 * 
 * Feature 2 Completion: Customer-facing seat selection UI
 * Interactive seat picker with real-time availability
 */

import React, { useState, useEffect } from 'react';
import { Check, X, User, Accessibility } from 'lucide-react';

interface SeatSelectorProps {
    eventId: string;
    onSeatsSelected: (seats: SelectedSeat[], totalPrice: number) => void;
}

interface SelectedSeat {
    id: string;
    section: string;
    row: string;
    number: number;
    price: number;
}

export default function SeatSelector({ eventId, onSeatsSelected }: SeatSelectorProps) {
    const [seatMap, setSeatMap] = useState<any>(null);
    const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
    const [loading, setLoading] = useState(true);
    const [holdExpiry, setHoldExpiry] = useState<number | null>(null);

    useEffect(() => {
        fetchSeatMap();
    }, [eventId]);

    useEffect(() => {
        if (selectedSeats.length > 0) {
            holdSeats();
        }
    }, [selectedSeats]);

    const fetchSeatMap = async () => {
        try {
            const response = await fetch(`/api/seating/${eventId}`);
            const data = await response.json();
            if (data.success) {
                setSeatMap(data.seatMap);
            }
        } catch (error) {
            console.error('Error fetching seat map:', error);
        } finally {
            setLoading(false);
        }
    };

    const holdSeats = async () => {
        const seatIds = selectedSeats.map(s => s.id);
        const sessionId = getSessionId();

        try {
            const response = await fetch('/api/seating/hold-seats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    seatMapId: seatMap.id,
                    userId: 'current-user-id', // Replace with actual user ID
                    seatIds,
                    sessionId
                })
            });

            const data = await response.json();
            if (data.success) {
                setHoldExpiry(data.expiresAt);
                // Start countdown timer
                startCountdown(data.expiresIn);
            }
        } catch (error) {
            console.error('Error holding seats:', error);
        }
    };

    const startCountdown = (milliseconds: number) => {
        const interval = setInterval(() => {
            setHoldExpiry(prev => {
                if (prev && prev > Date.now()) {
                    return prev;
                }
                clearInterval(interval);
                // Release seats
                setSelectedSeats([]);
                alert('Your seat hold has expired. Please select seats again.');
                fetchSeatMap(); // Refresh
                return null;
            });
        }, 1000);
    };

    const getSessionId = () => {
        let sessionId = sessionStorage.getItem('seat-selection-session');
        if (!sessionId) {
            sessionId = `session-${Date.now()}-${Math.random()}`;
            sessionStorage.setItem('seat-selection-session', sessionId);
        }
        return sessionId;
    };

    const toggleSeat = (section: any, row: any, seat: any) => {
        if (seat.status !== 'available') return;

        const seatId = seat.id;
        const isSelected = selectedSeats.some(s => s.id === seatId);

        if (isSelected) {
            setSelectedSeats(selectedSeats.filter(s => s.id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, {
                id: seatId,
                section: section.name,
                row: row.label,
                number: seat.number,
                price: seat.price
            }]);
        }
    };

    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    const handleConfirm = () => {
        onSeatsSelected(selectedSeats, totalPrice);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const timeRemaining = holdExpiry ? Math.max(0, Math.floor((holdExpiry - Date.now()) / 1000)) : 0;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return (
        <div className="space-y-6">
            {/* Timer */}
            {selectedSeats.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-yellow-800 font-medium">
                            Seats held for: {minutes}:{seconds.toString().padStart(2, '0')}
                        </div>
                    </div>
                    <div className="text-sm text-yellow-700">
                        Complete your purchase before time runs out
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-green-500 bg-white rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 bg-indigo-100 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-300 bg-gray-200 rounded"></div>
                    <span>Sold</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-500 bg-white rounded flex items-center justify-center">
                        <Accessibility size={14} className="text-purple-500" />
                    </div>
                    <span>Accessible</span>
                </div>
            </div>

            {/* Seat Map */}
            <div className="bg-gray-50 rounded-lg p-6">
                <div className="mb-6 text-center">
                    <div className="inline-block bg-gray-800 text-white px-12 py-2 rounded-t-lg">
                        STAGE
                    </div>
                </div>

                {seatMap?.layout?.sections.map((section: any) => (
                    <div key={section.id} className="mb-8">
                        <h3
                            className="font-semibold text-lg mb-4"
                            style={{ color: section.color }}
                        >
                            {section.name} - ${section.basePrice}
                        </h3>

                        <div className="space-y-2">
                            {section.rows.map((row: any) => (
                                <div key={row.id} className="flex items-center gap-3">
                                    <span className="w-10 text-sm font-medium text-gray-600 text-right">
                                        {row.label}
                                    </span>

                                    <div className="flex gap-1 flex-wrap">
                                        {row.seats.map((seat: any) => {
                                            const isSelected = selectedSeats.some(s => s.id === seat.id);
                                            const isAvailable = seat.status === 'available';
                                            const isSold = seat.status === 'sold';
                                            const isAccessible = seat.type === 'accessible';

                                            return (
                                                <button
                                                    key={seat.id}
                                                    onClick={() => toggleSeat(section, row, seat)}
                                                    disabled={!isAvailable}
                                                    className={`
                            w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-medium
                            transition-all relative group
                            ${isSelected
                                                            ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                                                            : isAvailable
                                                                ? 'border-green-500 bg-white hover:bg-green-50 cursor-pointer'
                                                                : isSold
                                                                    ? 'border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : 'border-yellow-500 bg-yellow-50 cursor-wait'
                                                        }
                          `}
                                                >
                                                    {isAccessible && (
                                                        <Accessibility size={16} className="absolute top-0 right-0 text-purple-500" />
                                                    )}
                                                    {seat.number}

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white px-3 py-2 rounded text-xs whitespace-nowrap z-10">
                                                        {row.label}{seat.number} - ${seat.price}
                                                        {isAccessible && ' (Accessible)'}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Seats Summary */}
            {selectedSeats.length > 0 && (
                <div className="bg-white border-2 border-indigo-600 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Selected Seats ({selectedSeats.length})</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {selectedSeats.map(seat => (
                            <div key={seat.id} className="bg-gray-50 rounded p-3">
                                <div className="font-medium">{seat.section}</div>
                                <div className="text-sm text-gray-600">Row {seat.row}, Seat {seat.number}</div>
                                <div className="text-sm font-semibold text-indigo-600">${seat.price}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-2xl font-bold">
                            Total: ${totalPrice.toFixed(2)}
                        </div>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            Continue to Payment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
