/**
 * TEAM COLLABORATION SYSTEM
 * Allows event hosts to add co-hosts and team members with role-based permissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export interface TeamMember {
    id: string;
    eventId: string;
    userId: string;
    userEmail: string;
    userName: string;
    role: 'owner' | 'co-host' | 'editor' | 'viewer';
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canManageAttendees: boolean;
        canManageTeam: boolean;
        canViewAnalytics: boolean;
        canCheckIn: boolean;
    };
    addedAt: string;
    addedBy: string;
}

const rolePermissions = {
    'co-host': {
        canEdit: true,
        canDelete: false,
        canManageAttendees: true,
        canManageTeam: true,
        canViewAnalytics: true,
        canCheckIn: true,
    },
    editor: {
        canEdit: true,
        canDelete: false,
        canManageAttendees: true,
        canManageTeam: false,
        canViewAnalytics: true,
        canCheckIn: true,
    },
    viewer: {
        canEdit: false,
        canDelete: false,
        canManageAttendees: false,
        canManageTeam: false,
        canViewAnalytics: true,
        canCheckIn: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { userEmail, role, userName, userId, addedBy } = req.body;

        if (!eventId || !userEmail || !role) {
            return res.status(400).json({ error: 'Event ID, user email, and role are required' });
        }

        const permissions =
            rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.viewer;

        const { data: newMember, error } = await supabaseAdmin
            .from('event_teams')
            .insert({
                event_id: eventId,
                user_email: userEmail,
                user_name: userName || userEmail,
                user_id: userId || null,
                role,
                permissions,
                added_by: addedBy || 'system',
            })
            .select('id')
            .single();

        if (error) {
            // Postgres unique violation code
            if (error.code === '23505') {
                return res.status(400).json({ error: 'User is already a team member' });
            }
            throw error;
        }

        console.log(`✅ Added ${userEmail} as ${role} to event ${eventId}`);

        return res.status(200).json({
            success: true,
            memberId: newMember.id,
            message: 'Team member added successfully',
        });
    } catch (error: any) {
        console.error('Error adding team member:', error);
        return res.status(500).json({ error: error.message || 'Failed to add team member' });
    }
}