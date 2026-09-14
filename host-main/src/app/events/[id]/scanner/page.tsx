'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface ValidationResult {
    valid: boolean;
    ticket?: any;
    message: string;
    alreadyCheckedIn?: boolean;
}

function QRScannerContent() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const [event, setEvent] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [stats, setStats] = useState({
        totalTickets: 0,
        checkedIn: 0,
        pending: 0,
    });

    useEffect(() => {
        loadEvent();
        loadStats();
        initializeScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, [eventId]);

    const loadEvent = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .maybeSingle();

            if (error) throw error;
            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
        }
    };

    const loadStats = async () => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('status, check_in_status')
                .eq('event_id', eventId);

            if (error) throw error;

            const confirmed = (data ?? []).filter((t) => t.status === 'confirmed');
            const checkedIn = confirmed.filter((t) => t.check_in_status === 'checked-in');

            setStats({
                totalTickets: confirmed.length,
                checkedIn: checkedIn.length,
                pending: confirmed.length - checkedIn.length,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const initializeScanner = () => {
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0,
            },
            false
        );

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
    };

    const onScanSuccess = async (decodedText: string) => {
        if (scanning) return;

        setScanning(true);
        await validateTicket(decodedText);
    };

    const onScanError = (error: any) => {
        // Ignore scan errors - they happen continuously while scanning
    };

    const validateTicket = async (qrDataString: string) => {
        try {
            const qrData = JSON.parse(qrDataString);

            const qrAge = Date.now() - qrData.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            if (qrAge > maxAge) {
                setValidationResult({ valid: false, message: '⚠️ QR code has expired. Please generate a new one.' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            if (qrData.eventId !== eventId) {
                setValidationResult({ valid: false, message: '❌ This ticket is for a different event' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            const { data: ticket, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', qrData.ticketId)
                .maybeSingle();

            if (error) throw error;

            if (!ticket) {
                setValidationResult({ valid: false, message: '❌ Ticket not found in database' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            if (ticket.user_id !== qrData.userId) {
                setValidationResult({ valid: false, message: '❌ Ticket user mismatch. Possible fraud.' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            if (ticket.status === 'cancelled') {
                setValidationResult({ valid: false, message: '❌ This ticket has been cancelled' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            if (ticket.status === 'pending') {
                setValidationResult({ valid: false, message: '⚠️ Ticket payment is pending. Not yet confirmed.' });
                setShowResult(true);
                setScanning(false);
                return;
            }

            if (ticket.status !== 'confirmed') {
                setValidationResult({ valid: false, message: `❌ Ticket status: ${ticket.status}` });
                setShowResult(true);
                setScanning(false);
                return;
            }

            const alreadyCheckedIn = ticket.check_in_status === 'checked-in';

            if (alreadyCheckedIn) {
                const timeStr = ticket.check_in_time
                    ? new Date(ticket.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'earlier';

                setValidationResult({
                    valid: true,
                    ticket,
                    alreadyCheckedIn: true,
                    message: `✓ Already checked in at ${timeStr}`,
                });
                setShowResult(true);
                setScanning(false);
                return;
            }

            setValidationResult({
                valid: true,
                ticket,
                message: '✅ Valid ticket - Ready for check-in',
                alreadyCheckedIn: false,
            });
            setShowResult(true);
            setScanning(false);
        } catch (error) {
            console.error('Validation error:', error);
            setValidationResult({ valid: false, message: '❌ Invalid QR code format' });
            setShowResult(true);
            setScanning(false);
        }
    };

    const handleCheckIn = async () => {
        if (!validationResult?.ticket || validationResult.alreadyCheckedIn) {
            handleDismiss();
            return;
        }

        try {
            const { data, error } = await supabase
                .rpc('global_check_in_ticket', { p_ticket_id: validationResult.ticket.id })
                .single();

            if (error) throw error;

            const result = data as { already_checked_in: boolean; check_in_time: string };

            if (result.already_checked_in) {
                alert(`⚠️ ${validationResult.ticket.user_name || 'Attendee'} was already checked in by someone else`);
            } else {
                alert(`✅ ${validationResult.ticket.user_name || 'Attendee'} checked in successfully!`);
            }

            loadStats();
            handleDismiss();
        } catch (error) {
            console.error('Error checking in:', error);
            alert('Failed to check in attendee');
        }
    };

    const handleDismiss = () => {
        setShowResult(false);
        setValidationResult(null);
        setScanning(false);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/events/${eventId}/attendees`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Attendees
                    </button>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
                        QR Scanner
                    </h1>
                    <p className="text-base text-gray-500">{event?.title || 'Loading...'}</p>
                </div>

                <div className="grid grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-2">Total Tickets</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.totalTickets}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-bold uppercase mb-2">Checked In</p>
                        <p className="text-3xl font-extrabold text-emerald-600">{stats.checkedIn}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-amber-100">
                        <p className="text-xs text-amber-600 font-bold uppercase mb-2">Pending</p>
                        <p className="text-3xl font-extrabold text-amber-600">{stats.pending}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-8">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-5">Scan Ticket QR Code</h2>
                    <div id="qr-reader" className="rounded-xl overflow-hidden"></div>
                    <p className="text-center text-gray-500 mt-4 font-medium text-sm">
                        Position the QR code within the frame to scan
                    </p>
                </div>

                {showResult && validationResult && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-7">
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                                    validationResult.valid ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                            >
                                <span className="text-3xl text-white">
                                    {validationResult.valid ? (validationResult.alreadyCheckedIn ? '✓✓' : '✓') : '✕'}
                                </span>
                            </div>

                            <h3 className="text-xl font-extrabold text-center mb-3">
                                {validationResult.valid
                                    ? validationResult.alreadyCheckedIn
                                        ? 'Already Checked In'
                                        : 'Valid Ticket'
                                    : 'Invalid Ticket'}
                            </h3>

                            <p className="text-center text-gray-600 mb-5 font-medium">{validationResult.message}</p>

                            {validationResult.valid && validationResult.ticket && (
                                <div className="bg-gray-50 rounded-xl p-5 mb-5 space-y-2.5 border border-gray-100">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium text-sm">Attendee:</span>
                                        <span className="font-bold text-gray-900 text-sm">{validationResult.ticket.user_name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium text-sm">Email:</span>
                                        <span className="font-bold text-gray-900 text-xs">{validationResult.ticket.user_email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium text-sm">Ticket Type:</span>
                                        <span className="font-bold text-gray-900 text-sm">{validationResult.ticket.ticket_type || 'General'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {validationResult.valid && !validationResult.alreadyCheckedIn ? (
                                    <>
                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCheckIn}
                                            className="flex-1 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors"
                                        >
                                            ✓ Check In
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full px-5 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-colors"
                                    >
                                        Scan Another
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function QRScannerPage() {
    return (
        <ProtectedRoute>
            <QRScannerContent />
        </ProtectedRoute>
    );
}