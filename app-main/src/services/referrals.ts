import { supabase } from './supabase';

export interface Referral {
    id: string;
    referrerId: string;
    referredUserId: string;
    code: string;
    status: 'pending' | 'completed';
    reward: number;
    createdAt: string;
}

/**
 * Generate a unique referral code for a user
 */
export const generateReferralCode = (userId: string): string => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userPart = userId.substring(0, 4).toUpperCase();
    return `${userPart}${random}`;
};

/**
 * Create referral code for user
 */
export const createReferralCode = async (userId: string): Promise<string> => {
    try {
        const code = generateReferralCode(userId);

        const { error } = await supabase
            .from('users')
            .update({
                referral_code: code,
                referral_count: 0,
            })
            .eq('id', userId);

        if (error) throw error;

        return code;
    } catch (error) {
        console.error('Error creating referral code:', error);
        throw error;
    }
};

/**
 * Apply referral code when user signs up
 */
export const applyReferralCode = async (
    newUserId: string,
    referralCode: string
): Promise<boolean> => {
    try {
        const { data: referrer, error: findError } = await supabase
            .from('users')
            .select('id, referral_count, referral_points')
            .eq('referral_code', referralCode)
            .maybeSingle();

        if (findError) throw findError;

        if (!referrer) {
            console.log('Invalid referral code');
            return false;
        }

        const { error: insertError } = await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_user_id: newUserId,
            code: referralCode,
            status: 'completed',
            reward: 100,
        });

        if (insertError) throw insertError;

        const { error: updateReferrerError } = await supabase
            .from('users')
            .update({
                referral_count: (referrer.referral_count || 0) + 1,
                referral_points: (referrer.referral_points || 0) + 100,
            })
            .eq('id', referrer.id);

        if (updateReferrerError) throw updateReferrerError;

        const { error: updateNewUserError } = await supabase
            .from('users')
            .update({
                referral_points: 50, // Welcome bonus
                referred_by: referrer.id,
            })
            .eq('id', newUserId);

        if (updateNewUserError) throw updateNewUserError;

        return true;
    } catch (error) {
        console.error('Error applying referral code:', error);
        return false;
    }
};

/**
 * Get user's referral stats
 */
export const getReferralStats = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', userId);

        if (error) throw error;

        const totalReferrals = data?.length || 0;
        const totalRewards = (data || []).reduce((sum, row) => sum + (row.reward || 0), 0);

        return {
            totalReferrals,
            totalRewards,
            referrals: data || [],
        };
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return { totalReferrals: 0, totalRewards: 0, referrals: [] };
    }
};

/**
 * Get referral leaderboard
 */
export const getReferralLeaderboard = async (limitCount: number = 10) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, referral_count, referral_points')
            .gt('referral_count', 0)
            .order('referral_count', { ascending: false })
            .limit(limitCount);

        if (error) throw error;

        return (data || []).map((row) => ({
            id: row.id,
            name: row.name,
            referralCount: row.referral_count || 0,
            referralPoints: row.referral_points || 0,
        }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
};