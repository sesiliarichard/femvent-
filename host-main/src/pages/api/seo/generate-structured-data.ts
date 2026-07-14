import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import type { EventStructuredData } from '@/types/seo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const { data: event, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .maybeSingle();

        if (error) throw error;
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const structuredData: EventStructuredData = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: event.title,
            description: event.description,
            startDate: event.start_at,
            endDate: event.end_at,
            eventStatus: event.is_cancelled ? 'EventCancelled' : 'EventScheduled',
            eventAttendanceMode: event.is_virtual
                ? 'OnlineEventAttendanceMode'
                : event.is_hybrid
                    ? 'MixedEventAttendanceMode'
                    : 'OfflineEventAttendanceMode',

            location: event.is_virtual
                ? {
                    '@type': 'VirtualLocation',
                    url: event.virtual_link || `https://yourplatform.com/events/${eventId}`,
                }
                : {
                    '@type': 'Place',
                    name: event.location?.venueName || event.location,
                    address: event.location?.address
                        ? {
                            '@type': 'PostalAddress',
                            streetAddress: event.location.address.street,
                            addressLocality: event.location.address.city,
                            addressRegion: event.location.address.state,
                            postalCode: event.location.address.zipCode,
                            addressCountry: event.location.address.country,
                        }
                        : undefined,
                },

            image: event.image_url ? [event.image_url] : [],

            organizer: {
                '@type': 'Organization',
                name: event.organizer_name || 'Event Organizer',
                url: `https://yourplatform.com/hosts/${event.host_id}`,
            },

            offers: event.ticket_types?.map((ticket: any) => ({
                '@type': 'Offer',
                price: ticket.price.toString(),
                priceCurrency: 'USD',
                availability: event.sold_out ? 'SoldOut' : 'InStock',
                url: `https://yourplatform.com/events/${eventId}/register`,
                validFrom: event.created_at,
            })) || [],

            aggregateRating: event.average_rating
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: event.average_rating,
                    reviewCount: event.total_reviews || 0,
                }
                : undefined,
        };

        return res.status(200).json({
            success: true,
            structuredData,
            scriptTag: `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`,
        });
    } catch (error: any) {
        console.error('Error generating structured data:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate structured data' });
    }
}