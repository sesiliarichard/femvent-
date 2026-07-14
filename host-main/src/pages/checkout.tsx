/**
 * Enhanced Checkout Page
 * 
 * Integrates: Discount Codes, Reserved Seating, Tax Calculation, Affiliate Tracking
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DiscountCodeInput from '@/components/DiscountCodeInput';
import SeatSelector from '@/components/SeatSelector';
import { getSessionId } from '@/lib/utils';

export default function CheckoutPage() {
    const router = useRouter();
    const { eventId } = router.query;

    const [event, setEvent] = useState<any>(null);
    const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            trackAffiliateClick();
        }
    }, [eventId]);

    useEffect(() => {
        calculateTotal();
    }, [subtotal, discount]);

    const fetchEvent = async () => {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        setEvent(data.event);
    };

    const trackAffiliateClick = async () => {
        const ref = new URLSearchParams(window.location.search).get('ref');

        if (ref) {
            await fetch('/api/affiliates/track-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referralCode: ref,
                    eventId,
                    sessionId: getSessionId(),
                    landingPage: window.location.pathname,
                    referrer: document.referrer,
                    utmSource: new URLSearchParams(window.location.search).get('utm_source'),
                    utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
                    utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
                })
            });
        }
    };

    const calculateTotal = async () => {
        const afterDiscount = subtotal - discount;

        // Calculate tax
        const taxResponse = await fetch('/api/tax/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: afterDiscount,
                eventId,
                customerLocation: {
                    country: 'US',
                    state: 'CA',
                    city: 'San Francisco'
                }
            })
        });

        const taxData = await taxResponse.json();
        if (taxData.success) {
            setTax(taxData.totalTax);
            setTotal(afterDiscount + taxData.totalTax);
        }
    };

    const handleCheckout = async () => {
        setLoading(true);

        try {
            // Confirm seats if reserved seating
            if (selectedSeats.length > 0) {
                await fetch('/api/seating/confirm-seats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId,
                        seatMapId: event.seatMapId,
                        userId: 'current-user-id',
                        seatIds: selectedSeats.map(s => s.id),
                        sessionId: getSessionId()
                    })
                });
            }

            // Process payment (integrate with Stripe)
            const paymentResponse = await fetch('/api/payments/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    amount: total,
                    seatIds: selectedSeats.map(s => s.id),
                    sessionId: getSessionId()
                })
            });

            const { sessionUrl } = await paymentResponse.json();
            window.location.href = sessionUrl;

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Checkout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!event) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Info */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">{event.title}</h2>
                            <p className="text-gray-600">{event.description}</p>
                        </div>

                        {/* Reserved Seating */}
                        {event.hasReservedSeating && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Select Your Seats</h2>
                                <SeatSelector
                                    eventId={eventId as string}
                                    onSeatsSelected={(seats, seatTotal) => {
                                        setSelectedSeats(seats);
                                        setSubtotal(seatTotal);
                                    }}
                                />
                            </div>
                        )}

                        {/* Discount Code */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Discount Code</h2>
                            <DiscountCodeInput
                                eventId={eventId as string}
                                subtotal={subtotal}
                                onDiscountApplied={(discountData) => {
                                    setDiscount(discountData.discountAmount);
                                }}
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-semibold">${tax.toFixed(2)}</span>
                                </div>

                                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {selectedSeats.length > 0 && (
                                <div className="mb-4 p-3 bg-indigo-50 rounded">
                                    <div className="text-sm font-medium text-indigo-900 mb-2">
                                        Selected Seats:
                                    </div>
                                    <div className="text-sm text-indigo-700">
                                        {selectedSeats.map(seat => `${seat.section} ${seat.row}${seat.number}`).join(', ')}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={loading || subtotal === 0}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Complete Purchase'}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Secure payment powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
