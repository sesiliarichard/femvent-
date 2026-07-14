/**
 * AffiliateDashboard Component
 * 
 * Feature 5 Completion: Dashboard for affiliates to track performance
 * Shows clicks, conversions, commission earned, and referral links
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, MousePointer, DollarSign, Copy, Check } from 'lucide-react';

export default function AffiliateDashboard({ userId }: { userId: string }) {
    const [affiliate, setAffiliate] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAffiliateData();
    }, [userId]);

    const fetchAffiliateData = async () => {
        try {
            // Fetch affiliate account
            const affiliateRes = await fetch(`/api/affiliates/${userId}`);
            const affiliateData = await affiliateRes.json();
            setAffiliate(affiliateData.affiliate);

            // Fetch detailed stats
            const statsRes = await fetch(`/api/affiliates/${userId}/stats`);
            const statsData = await statsRes.json();
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching affiliate data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = (eventId?: string) => {
        const baseUrl = window.location.origin;
        const link = eventId
            ? `${baseUrl}/events/${eventId}?ref=${affiliate.code}`
            : `${baseUrl}?ref=${affiliate.code}`;

        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const commissionRate = (affiliate?.commissionRate * 100) || 0;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
                <p className="text-gray-600 mt-2">Track your referrals and earnings</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {affiliate?.stats?.totalClicks || 0}
                            </p>
                        </div>
                        <MousePointer className="h-12 w-12 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Conversions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {affiliate?.stats?.totalConversions || 0}
                            </p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {affiliate?.stats?.conversionRate?.toFixed(1) || 0}% conversion rate
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ${affiliate?.stats?.totalRevenue?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-purple-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Avg: ${affiliate?.stats?.averageOrderValue?.toFixed(2) || '0.00'} per sale
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                ${affiliate?.stats?.totalCommission?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {commissionRate}% commission rate
                    </p>
                </div>
            </div>

            {/* Referral Links */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Your Referral Links</h2>

                {/* General Link */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        General Referral Link
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={`${window.location.origin}?ref=${affiliate?.code}`}
                            readOnly
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        />
                        <button
                            onClick={() => copyReferralLink()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Share this link to earn commission on all event sales
                    </p>
                </div>

                {/* Event-Specific Links */}
                {affiliate?.eventIds?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event-Specific Links
                        </label>
                        <div className="space-y-2">
                            {affiliate.eventIds.map((eventId: string) => (
                                <div key={eventId} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/events/${eventId}?ref=${affiliate.code}`}
                                        readOnly
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                    />
                                    <button
                                        onClick={() => copyReferralLink(eventId)}
                                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Commission History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Commission History</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Order Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Commission
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.recentCommissions?.map((commission: any) => (
                            <tr key={commission.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(commission.earnedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {commission.eventTitle || 'Event'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${commission.orderTotal.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                    ${commission.commissionAmount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            commission.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {commission.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {(!stats?.recentCommissions || stats.recentCommissions.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No commissions yet. Start sharing your referral link!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Payout Button */}
            {(affiliate?.stats?.totalCommission || 0) > 50 && (
                <div className="mt-6 flex justify-end">
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                        Request Payout (${affiliate.stats.totalCommission.toFixed(2)})
                    </button>
                </div>
            )}
        </div>
    );
}
