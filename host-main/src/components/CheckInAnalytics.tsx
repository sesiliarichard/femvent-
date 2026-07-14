/**
 * CHECK-IN ANALYTICS DASHBOARD
 * Real-time analytics for event check-ins
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CheckInAnalyticsProps {
    eventId: string;
}

interface CheckInStats {
    totalTickets: number;
    checkedIn: number;
    notCheckedIn: number;
    checkInRate: number;
    peakHour: string;
    avgCheckInDuration: number;
    hourlyData: { [hour: string]: number };
}

const CheckInAnalytics: React.FC<CheckInAnalyticsProps> = ({ eventId }) => {
    const [stats, setStats] = useState<CheckInStats>({
        totalTickets: 0,
        checkedIn: 0,
        notCheckedIn: 0,
        checkInRate: 0,
        peakHour: 'N/A',
        avgCheckInDuration: 0,
        hourlyData: {},
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('event_id', eventId);

                if (error) throw error;

                const tickets = data || [];
                const checkedInTickets = tickets.filter((t: any) => t.check_in_status === 'checked-in');

                // Calculate hourly check-ins
                const hourlyData: { [hour: string]: number } = {};
                checkedInTickets.forEach((ticket: any) => {
                    if (ticket.check_in_time) {
                        const hour = new Date(ticket.check_in_time).getHours();
                        const hourKey = `${hour}:00`;
                        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
                    }
                });

                // Find peak hour
                let peakHour = 'N/A';
                let maxCheckIns = 0;
                Object.entries(hourlyData).forEach(([hour, count]) => {
                    if (count > maxCheckIns) {
                        maxCheckIns = count;
                        peakHour = hour;
                    }
                });

                setStats({
                    totalTickets: tickets.length,
                    checkedIn: checkedInTickets.length,
                    notCheckedIn: tickets.length - checkedInTickets.length,
                    checkInRate: tickets.length > 0 ? (checkedInTickets.length / tickets.length) * 100 : 0,
                    peakHour,
                    avgCheckInDuration: 0, // Calculate if you have duration data
                    hourlyData,
                });
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
        // Refresh every minute
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, [eventId]);

    if (loading) {
        return <div className="text-center py-8">Loading analytics...</div>;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Check-In Analytics</h3>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <p className="text-sm text-blue-600 mb-1">Total Tickets</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalTickets}</p>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <p className="text-sm text-green-600 mb-1">Checked In</p>
                    <p className="text-3xl font-bold text-green-900">{stats.checkedIn}</p>
                </div>
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <p className="text-sm text-orange-600 mb-1">Not Checked In</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.notCheckedIn}</p>
                </div>
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <p className="text-sm text-purple-600 mb-1">Check-In Rate</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.checkInRate.toFixed(1)}%</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Check-In Progress</span>
                    <span className="text-sm text-gray-600">{stats.checkedIn} / {stats.totalTickets}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${stats.checkInRate}%` }}
                    />
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Peak Check-In Hour</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.peakHour}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">No-Show Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {((stats.notCheckedIn / (stats.totalTickets || 1)) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Hourly Chart (Simple Bar Chart) */}
            {Object.keys(stats.hourlyData).length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Hourly Check-Ins</h4>
                    <div className="flex items-end justify-between gap-2 h-32">
                        {Object.entries(stats.hourlyData).map(([hour, count]) => {
                            const maxCount = Math.max(...Object.values(stats.hourlyData));
                            const height = (count / maxCount) * 100;
                            return (
                                <div key={hour} className="flex flex-col items-center flex-1">
                                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }} title={`${count} check-ins`} />
                                    <p className="text-xs text-gray-600 mt-1">{hour}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckInAnalytics;
