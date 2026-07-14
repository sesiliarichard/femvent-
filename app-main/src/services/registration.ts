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
      .eq('user_id', registrationData.userId);

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

  // Guard against duplicate subscriptions (e.g. React StrictMode double-invoking effects)
  const existingChannel = supabase.getChannels().find((ch) => ch.topic === `realtime:tickets-${userId}`);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(`tickets-${userId}`)
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
      .eq('user_id', userId);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking event registration:', error);
    return false;
  }
};

export const getEventAttendeesList = async (eventId: string): Promise<any[]> => {
  try {
    const { data: ticketRows, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'pending']);

    if (error) throw error;

    const attendees: any[] = [];
    const processedUserIds = new Set<string>();

    for (const ticketData of ticketRows || []) {
      const userId = ticketData.user_id;

      if (processedUserIds.has(userId)) {
        continue;
      }

      let attendee = {
        id: userId,
        name: `Attendee ${userId.slice(-4)}`,
        email: '',
        photoURL: null as string | null,
        registrationDate: ticketData.created_at ? new Date(ticketData.created_at) : new Date(),
        ticketStatus: ticketData.status,
      };

      try {
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!userError && userRow) {
          attendee.name = userRow.name || userRow.email?.split('@')[0] || `User ${userId.slice(-4)}`;
          attendee.email = userRow.email || '';
          attendee.photoURL = userRow.photo_url || null;
        } else if (ticketData.user_name) {
          attendee.name = ticketData.user_name;
          attendee.email = ticketData.user_email || '';
          attendee.photoURL = ticketData.user_photo_url || null;
        } else {
          try {
            await supabase.from('users').insert({
              id: userId,
              name: `User ${userId.slice(-4)}`,
              email: '',
              role: 'attendee',
              status: 'active',
            });
            console.log('Created basic user record for:', userId);
            attendee.name = `User ${userId.slice(-4)}`;
          } catch (createError) {
            console.log('Could not create user record for:', userId);
          }
        }
      } catch (error) {
        console.log('Could not fetch user data for:', userId, '- using fallback');
        if (ticketData.user_name) {
          attendee.name = ticketData.user_name;
          attendee.email = ticketData.user_email || '';
          attendee.photoURL = ticketData.user_photo_url || null;
        }
      }

      attendees.push(attendee);
      processedUserIds.add(userId);
    }

    return attendees;
  } catch (error) {
    console.error('Error fetching event attendees list:', error);
    return [];
  }
};