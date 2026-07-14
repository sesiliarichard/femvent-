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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 p-8">
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/events/${eventId}/attendees`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Attendees
                    </button>

                    <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-purple-900 to-blue-900 bg-clip-text text-transparent mb-2">
                        QR Scanner
                    </h1>
                    <p className="text-xl text-slate-600 font-medium">{event?.title || 'Loading...'}</p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 shadow-xl">
                        <p className="text-sm text-slate-500 font-bold uppercase mb-2">Total Tickets</p>
                        <p className="text-4xl font-black text-slate-900">{stats.totalTickets}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-green-200/50 shadow-xl">
                        <p className="text-sm text-green-600 font-bold uppercase mb-2">Checked In</p>
                        <p className="text-4xl font-black text-green-600">{stats.checkedIn}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-amber-200/50 shadow-xl">
                        <p className="text-sm text-amber-600 font-bold uppercase mb-2">Pending</p>
                        <p className="text-4xl font-black text-amber-600">{stats.pending}</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 mb-8">
                    <h2 className="text-2xl font-black mb-6">Scan Ticket QR Code</h2>
                    <div id="qr-reader" className="rounded-2xl overflow-hidden"></div>
                    <p className="text-center text-slate-500 mt-4 font-semibold">
                        Position the QR code within the frame to scan
                    </p>
                </div>

                {showResult && validationResult && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8">
                            <div
                                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                                    validationResult.valid
                                        ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                                }`}
                            >
                                <span className="text-5xl text-white">
                                    {validationResult.valid ? (validationResult.alreadyCheckedIn ? '✓✓' : '✓') : '✕'}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-center mb-4">
                                {validationResult.valid
                                    ? validationResult.alreadyCheckedIn
                                        ? 'Already Checked In'
                                        : 'Valid Ticket'
                                    : 'Invalid Ticket'}
                            </h3>

                            <p className="text-center text-slate-600 mb-6 font-semibold text-lg">{validationResult.message}</p>

                            {validationResult.valid && validationResult.ticket && (
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 mb-6 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-semibold">Attendee:</span>
                                        <span className="font-bold text-slate-900">{validationResult.ticket.user_name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-semibold">Email:</span>
                                        <span className="font-bold text-slate-900 text-sm">{validationResult.ticket.user_email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-semibold">Ticket Type:</span>
                                        <span className="font-bold text-slate-900">{validationResult.ticket.ticket_type || 'General'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {validationResult.valid && !validationResult.alreadyCheckedIn ? (
                                    <>
                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCheckIn}
                                            className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold hover:shadow-xl transition-all"
                                        >
                                            ✓ Check In
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-xl transition-all"
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