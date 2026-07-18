import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, name, layout } = req.body;

        if (!eventId || !name || !layout) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let totalCapacity = 0;
        layout.sections.forEach((section: any) => {
            section.rows.forEach((row: any) => {
                totalCapacity += row.seats.filter((s: any) => s.type !== 'blocked').length;
            });
        });

        const { data: seatMap, error: mapError } = await supabaseAdmin
            .from('seat_maps')
            .insert({ event_id: eventId, name, total_capacity: totalCapacity, width: layout.width, height: layout.height })
            .select()
            .single();

        if (mapError) throw mapError;

        for (const section of layout.sections) {
            const { data: sectionRow, error: sectionError } = await supabaseAdmin
                .from('seat_sections')
                .insert({
                    seat_map_id: seatMap.id,
                    name: section.name,
                    color: section.color,
                    base_price: section.basePrice,
                    pos_x: section.position.x,
                    pos_y: section.position.y,
                })
                .select()
                .single();

            if (sectionError) throw sectionError;

            const seatsToInsert = section.rows.flatMap((row: any) =>
                row.seats.map((seat: any) => ({
                    seat_map_id: seatMap.id,
                    section_id: sectionRow.id,
                    row_label: row.label,
                    seat_number: String(seat.number),
                    type: seat.type,
                    status: seat.type === 'blocked' ? 'sold' : 'available',
                    price: seat.price,
                    pos_x: seat.position?.x,
                    pos_y: seat.position?.y,
                }))
            );

            if (seatsToInsert.length > 0) {
                const { error: seatsError } = await supabaseAdmin.from('seats').insert(seatsToInsert);
                if (seatsError) throw seatsError;
            }
        }

        return res.status(201).json({
            success: true,
            seatMapId: seatMap.id,
            totalCapacity,
            message: 'Seat map created successfully',
        });
    } catch (error: any) {
        console.error('Error creating seat map:', error);
        return res.status(500).json({ error: error.message || 'Failed to create seat map' });
    }
}