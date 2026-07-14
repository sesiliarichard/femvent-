import { supabase } from './supabase';
import type { Payment, Event as AppEvent } from '../types';

// User Management
export const getUserStats = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;

    const totalUsers = data?.length || 0;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const activeUsers = (data || []).filter((u: any) => {
      const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
      return Boolean(lastSeen && lastSeen > tenMinutesAgo) && u.status !== 'suspended';
    }).length;

    const pendingHosts = (data || []).filter(
      (u: any) => u.host_application?.status === 'pending'
    ).length;

    return { totalUsers, activeUsers, pendingHosts };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { totalUsers: 0, activeUsers: 0, pendingHosts: 0 };
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      ...row,
      isSuspended: row.status === 'suspended',
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      hostApplication: row.host_application
        ? {
            ...row.host_application,
            appliedAt: row.host_application.appliedAt
              ? new Date(row.host_application.appliedAt)
              : undefined,
          }
        : null,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) throw error;

    await logActivity({
      type: 'user_role_updated',
      user: 'Admin',
      description: `Updated user role to ${role}`,
      metadata: { userId, newRole: role },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const updateHostApplication = async (
  userId: string,
  status: string,
  rejectionReason?: string
) => {
  try {
    const { data: current } = await supabase
      .from('users')
      .select('host_application')
      .eq('id', userId)
      .single();

    const hostApplication = {
      ...(current?.host_application || {}),
      status,
      reviewedAt: new Date().toISOString(),
      ...(status === 'rejected' && rejectionReason ? { rejectionReason } : {}),
    };

    const updatePayload: any = { host_application: hostApplication };
    if (status === 'approved') updatePayload.role = 'host';

    const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
    if (error) throw error;

    await logActivity({
      type: 'host_application_reviewed',
      user: 'Admin',
      description: `Host application ${status} for user`,
      metadata: { userId, status, rejectionReason },
    });
  } catch (error) {
    console.error('Error updating host application:', error);
    throw error;
  }
};

export const suspendUser = async (userId: string, isSuspended: boolean) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: isSuspended ? 'suspended' : 'active' })
      .eq('id', userId);
    if (error) throw error;

    await logActivity({
      type: isSuspended ? 'user_suspended' : 'user_activated',
      user: 'Admin',
      description: `User ${isSuspended ? 'suspended' : 'activated'}`,
      metadata: { userId },
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

// Event Management
export const getEventStats = async () => {
  try {
    const { data, error } = await supabase.from('events').select('*');
    if (error) throw error;

    const totalEvents = data?.length || 0;
    const activeEvents = (data || []).filter((e: any) => e.status !== 'cancelled').length;
    const upcomingEvents = (data || []).filter(
      (e: any) => e.event_date && new Date(e.event_date) > new Date()
    ).length;

    return { totalEvents, activeEvents, upcomingEvents };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return { totalEvents: 0, activeEvents: 0, upcomingEvents: 0 };
  }
};

export const getAllEvents = async (): Promise<AppEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, host:users(id, name, avatar)');
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || '',
      description: row.description || '',
      date: row.event_date ? new Date(row.event_date) : new Date(),
      imageURL: row.image_url,
      posterURL: row.poster_url,
      price: row.price || 0,
      category: row.category || 'technology',
      capacity: row.capacity || 0,
      location: row.location || '',
      host: {
        id: row.host?.id || '',
        name: row.host?.name || '',
        avatar: row.host?.avatar,
      },
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      status: row.status || 'draft',
    })) as AppEvent[];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const createEvent = async (eventData: any) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        event_date: new Date(eventData.date).toISOString(),
        category: eventData.category,
        price: eventData.price,
        capacity: eventData.capacity,
        image_url: eventData.imageURL,
        poster_url: eventData.posterURL,
        host_id: eventData.host?.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      type: 'event_created',
      user: 'Admin',
      description: `Created event "${eventData.title}"`,
      metadata: { eventId: data.id, eventTitle: eventData.title },
    });

    return data.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, eventData: any) => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        event_date: new Date(eventData.date).toISOString(),
        category: eventData.category,
        price: eventData.price,
        capacity: eventData.capacity,
        image_url: eventData.imageURL,
        poster_url: eventData.posterURL,
      })
      .eq('id', eventId);

    if (error) throw error;

    await logActivity({
      type: 'event_updated',
      user: 'Admin',
      description: `Updated event "${eventData.title}"`,
      metadata: { eventId, eventTitle: eventData.title },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    console.log('Attempting to delete event:', eventId);

    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (fetchError || !eventData) {
      throw new Error('Event not found');
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;

    console.log('Event deleted successfully');

    await logActivity({
      type: 'event_deleted',
      user: 'Admin',
      description: `Deleted event "${eventData.title}"`,
      metadata: { eventId, eventTitle: eventData.title },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Payment Management
export const getPaymentStats = async () => {
  try {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;

    const totalPayments = data?.length || 0;
    const completedPayments = (data || []).filter((p: any) => p.status === 'completed').length;
    const pendingPayments = (data || []).filter((p: any) => p.status === 'pending').length;
    const totalRevenue = (data || []).reduce(
      (sum: number, p: any) => (p.status === 'completed' ? sum + (p.amount || 0) : sum),
      0
    );

    return { totalPayments, completedPayments, pendingPayments, totalRevenue };
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return { totalPayments: 0, completedPayments: 0, pendingPayments: 0, totalRevenue: 0 };
  }
};
export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      type: row.type,
      status: row.status === 'completed' ? 'succeeded' : row.status,
      method: row.payment_method || 'manual',
      description: row.notes,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      currency: row.currency,
      meta: {
        eventId: row.event_id,
        recordedBy: row.meta?.recordedBy,
        recordedAt: row.meta?.recordedAt ? new Date(row.meta.recordedAt) : undefined,
      },
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const createPayment = async (paymentData: any) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        event_id: paymentData.eventId,
        user_id: paymentData.userId,
        amount: paymentData.amount,
        status: paymentData.status || 'pending',
        type: paymentData.type,
        currency: paymentData.currency || 'USD',
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
        meta: { ...paymentData.meta, recordedBy: 'admin' },
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      type: 'payment_recorded',
      user: 'Admin',
      description: `Recorded payment of $${paymentData.amount} for ${paymentData.type}`,
      metadata: { paymentId: data.id, amount: paymentData.amount, type: paymentData.type },
    });

    return data.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: string) => {
  try {
    const { error } = await supabase.from('payments').update({ status }).eq('id', paymentId);
    if (error) throw error;

    await logActivity({
      type: 'payment_status_updated',
      user: 'Admin',
      description: `Updated payment status to ${status}`,
      metadata: { paymentId, status },
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

export const recordPayment = async (paymentData: any) => {
  return createPayment(paymentData);
};

// Activity Feed
export const getRecentActivity = async () => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      user: row.actor,
      description: row.description,
      timestamp: row.created_at ? new Date(row.created_at) : undefined,
      metadata: row.metadata,
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

export const logActivity = async (activityData: any) => {
  try {
    const { error } = await supabase.from('activities').insert({
      type: activityData.type,
      actor: activityData.user,
      description: activityData.description,
      metadata: activityData.metadata || {},
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Analytics
export const getAnalyticsData = async () => {
  try {
    const [users, events, payments] = await Promise.all([
      getAllUsers(),
      getAllEvents(),
      getAllPayments(),
    ]);

    const totalUsers = users.length;
    const totalEvents = events.length;
    const totalRevenue = payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const userGrowth = users.reduce((acc: Record<string, number>, user: any) => {
      if (user.createdAt) {
        const month = user.createdAt.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    const revenueGrowth = payments
      .filter((p: any) => p.status === 'completed')
      .reduce((acc: Record<string, number>, payment: any) => {
        if (payment.createdAt) {
          const month = payment.createdAt.toISOString().slice(0, 7);
          acc[month] = (acc[month] || 0) + payment.amount;
        }
        return acc;
      }, {});

    const eventPerformance = events
      .map((event: any) => {
        const eventPayments = payments.filter(
          (p: any) => p.meta?.eventId === event.id && p.status === 'completed'
        );
        const revenue = eventPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const attendeeCount = eventPayments.length;

        return { id: event.id, title: event.title, revenue, attendeeCount, growth: '+12%' };
      })
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalUsers, totalEvents, totalRevenue, userGrowth, revenueGrowth, eventPerformance };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      totalUsers: 0,
      totalEvents: 0,
      totalRevenue: 0,
      userGrowth: {},
      revenueGrowth: {},
      eventPerformance: [],
    };
  }
};

// Real-time subscriptions
export const subscribeToUserStats = (callback: (stats: any) => void) => {
  const channel = supabase
    .channel('user-stats-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
      callback(await getUserStats());
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const subscribeToEventStats = (callback: (stats: any) => void) => {
  const channel = supabase
    .channel('event-stats-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => {
      callback(await getEventStats());
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const subscribeToPaymentStats = (callback: (stats: any) => void) => {
  const channel = supabase
    .channel('payment-stats-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
      callback(await getPaymentStats());
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const subscribeToRecentActivity = (callback: (activities: any[]) => void) => {
  const channel = supabase
    .channel('activity-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, async () => {
      callback(await getRecentActivity());
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

// Host applications
export const approveHostApplication = async (userId: string) => {
  try {
    const { data: current } = await supabase
      .from('users')
      .select('host_application')
      .eq('id', userId)
      .single();

    const hostApplication = {
      ...(current?.host_application || {}),
      status: 'approved',
      approvedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .update({ role: 'host', host_application: hostApplication })
      .eq('id', userId);
    if (error) throw error;

    await logActivity({
      type: 'host_application_approved',
      user: 'Admin',
      description: `Approved host application for user`,
      metadata: { userId },
    });
  } catch (error) {
    console.error('Error approving host application:', error);
    throw error;
  }
};

export const rejectHostApplication = async (userId: string, reason: string) => {
  try {
    const { data: current } = await supabase
      .from('users')
      .select('host_application')
      .eq('id', userId)
      .single();

    const hostApplication = {
      ...(current?.host_application || {}),
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .update({ host_application: hostApplication })
      .eq('id', userId);
    if (error) throw error;

    await logActivity({
      type: 'host_application_rejected',
      user: 'Admin',
      description: `Rejected host application for user`,
      metadata: { userId, reason },
    });
  } catch (error) {
    console.error('Error rejecting host application:', error);
    throw error;
  }
};