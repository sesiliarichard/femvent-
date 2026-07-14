/**
 * Affiliate Dashboard Page
 * 
 * Public-facing page for affiliates to track their performance
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AffiliateDashboard from '@/components/AffiliateDashboard';

export default function AffiliatePortalPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Get current user from your auth system
            const response = await fetch('/api/auth/me');
            const data = await response.json();

            if (data.user) {
                setUserId(data.user.uid);
            } else {
                // Redirect to login
                router.push('/login?redirect=/affiliate/dashboard');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Access Denied
                    </h2>
                    <p className="text-gray-600">
                        Please log in to access the affiliate dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AffiliateDashboard userId={userId} />
        </div>
    );
}
