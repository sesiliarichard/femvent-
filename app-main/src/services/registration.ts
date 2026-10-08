import { supabase } from './supabase';
import { Ticket, Event } from '../types';
import { sendEventRegistrationEmail, formatEventDate, formatEventTime } from './emailNotifications';

export interface RegistrationData {
  eventId: string;
  userId: string;
  priceOptionId?: string;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string;
  attendeeInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const mapEventRow = (row: any): Event => ({
  id: row.id,
  ...row,
  date: row.event_date ? new Date(row.event_date) : undefined,
  startAt: row.start_at ? new Date(row.start_at) : undefined,
  endAt: row.end_at ? new Date(row.end_at) : undefined,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
} as Event);

const mapTicketRow = async (row: any): Promise<Ticket | null> => {
  try {
    let event: Event | undefined;

    if (row.event_id) {
      try {
        const { data: eventRow, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', row.event_id)
          .maybeSingle();

        if (!error && eventRow) {
          event = mapEventRow(eventRow);
        }
      } catch (eventError) {
        console.warn('Error fetching event for ticket:', row.event_id, eventError);
      }
    }

    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      paymentId: row.payment_id,
      status: row.status,
      qrCodeId: row.qr_code_id,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      priceOption: row.price_option,
      userName: row.user_name,
      userEmail: row.user_email,
      userPhotoURL: row.user_photo_url,
      checkInStatus: row.check_in_status,
      checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
      event,
    } as Ticket;
  } catch (error) {
    console.error('Error mapping ticket row:', error);
    return null;
  }
};

export const registerForEvent = async (registrationData: RegistrationData): Promise<string> => {
  try {
    // Check if user is already registered for this event
    const { data: existingTickets, error: existingError } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', registrationData.eventId)
      .eq('user_id', registrationData.userId)
      .in('status', ['confirmed', 'pending']);

    if (existingError) throw existingError;
    if (existingTickets && existingTickets.length > 0) {
      throw new Error('You are already registered for this event');
    }

    // Create a new ticket (pending admin approval, same as before)
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        event_id: registrationData.eventId,
        user_id: registrationData.userId,
        payment_id: `manual_${Date.now()}`,
        status: 'pending',
        price_option: {
          id: registrationData.priceOptionId || 'default',
          name: 'General Admission',
          price: 0,
          currency: 'USD',
          isAvailable: true,
        },
        user_name: registrationData.userName || 'Attendee',
        user_email: registrationData.userEmail || '',
        user_photo_url: registrationData.userPhotoURL || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const ticketId = ticket.id;

    // Set qr_code_id now that we have the ticket id (mirrors old qr_${ticketId} pattern)
    await supabase
      .from('tickets')
      .update({ qr_code_id: `qr_${ticketId}` })
      .eq('id', ticketId);

    // Send registration confirmation email (non-blocking, same as before)
    try {
      const { data: eventRow } = await supabase
        .from('events')
        .select('*')
        .eq('id', registrationData.eventId)
        .maybeSingle();

      if (eventRow && registrationData.userEmail) {
        const eventDate = eventRow.event_date ? new Date(eventRow.event_date) : new Date();

        sendEventRegistrationEmail({
          userName: registrationData.userName || 'there',
          userEmail: registrationData.userEmail,
          eventTitle: eventRow.title || 'Event',
          eventDate: formatEventDate(eventDate),
          eventTime: formatEventTime(eventDate),
          eventLocation: eventRow.location || 'TBD',
          eventImageUrl: eventRow.image_url || eventRow.poster_url,
          ticketStatus: 'pending',
        }).catch((emailError) => {
          console.log('Registration confirmation email could not be sent:', emailError);
        });
      }
    } catch (emailError) {
      console.log('Could not send registration email:', emailError);
    }

    return ticketId;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tickets = await Promise.all((data || []).map(mapTicketRow));
    return tickets.filter(Boolean) as Ticket[];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

export const subscribeToUserTickets = (
  userId: string,
  onUpdate: (tickets: Ticket[]) => void,
  onError?: (error: any) => void
) => {
  // Initial fetch
  getUserTickets(userId).then(onUpdate).catch((error) => onError?.(error));

  // Unique name per subscriber: Profile and Tickets both subscribe for the same user,
  // and a shared name makes one remove the other's channel.
  const channel = supabase
    .channel(`tickets-${userId}-${Date.now()}-${Math.random()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${userId}` },
      async () => {
        try {
          const tickets = await getUserTickets(userId);
          onUpdate(tickets);
        } catch (error) {
          console.error('Error processing ticket updates:', error);
          onError?.(error);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const checkEventRegistration = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('status', ['confirmed', 'pending']);
    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking event registration:', error);
    return false;
  }
};

export const getEventAttendeesList = async (eventId: string): Promise<any[]> => {
  try {
    // Respect the host's setting (Access & Care tab → "Participant names may be visible to others").
    // Delete this block if you'd rather always show the list.
    const { data: eventRow } = await supabase
      .from('events')
      .select('privacy_info')
      .eq('id', eventId)
      .maybeSingle();

    if (!eventRow?.privacy_info?.participant_names_public) {
      return [];
    }

    const { data: ticketRows, error } = await supabase
      .from('tickets')
      .select('user_id, status, created_at, user_name, user_photo_url')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (error) throw error;

    const userIds = Array.from(new Set((ticketRows || []).map((t: any) => t.user_id)));
    const profiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, name, photo_url')
        .in('id', userIds);
      (userRows || []).forEach((u: any) => {
        profiles[u.id] = u;
      });
    }

    const seen = new Set<string>();
    const attendees: any[] = [];

    for (const t of ticketRows || []) {
      if (seen.has(t.user_id)) continue;
      seen.add(t.user_id);

      const profile = profiles[t.user_id];
      attendees.push({
        id: t.user_id,
        name: profile?.name || t.user_name || `Attendee ${t.user_id.slice(-4)}`,
        email: '', // never expose attendee emails to other attendees
        photoURL: profile?.photo_url || t.user_photo_url || null,
        registrationDate: t.created_at ? new Date(t.created_at) : new Date(),
        ticketStatus: t.status,
      });
    }

    return attendees;
  } catch (error) {
    console.error('Error fetching event attendees list:', error);
    return [];
  }
};