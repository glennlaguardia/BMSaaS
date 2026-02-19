import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createV1Handler, createV1Options } from '@/lib/v1-handler';
import { publicDateRangeSchema } from '@/lib/validations';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';

export const GET = createV1Handler(
    { endpoint: 'v1/availability' },
    async ({ tenantId, request }) => {
        const { searchParams } = new URL(request.url);
        const dateParams = publicDateRangeSchema.safeParse({
            start_date: searchParams.get('start_date') ?? undefined,
            end_date: searchParams.get('end_date') ?? undefined,
            type_id: searchParams.get('type_id') ?? undefined,
        });

        if (!dateParams.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid query parameters', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        const startDate = dateParams.data.start_date ?? null;
        const endDate = dateParams.data.end_date ?? null;
        const typeId = dateParams.data.type_id ?? null;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'start_date and end_date required', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        // Guard against excessive date ranges (max 90 days)
        const daySpan = differenceInDays(parseISO(endDate), parseISO(startDate));
        if (daySpan < 0 || daySpan > 90) {
            return NextResponse.json(
                { success: false, error: 'Date range must be between 1 and 90 days', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        let roomQuery = supabase
            .from('rooms')
            .select('id, accommodation_type_id')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        if (typeId) {
            roomQuery = roomQuery.eq('accommodation_type_id', typeId);
        }

        const { data: rooms } = await roomQuery;
        const totalRooms = rooms?.length || 0;
        const roomIds = rooms?.map(r => r.id) || [];

        const { data: bookings } = await supabase
            .from('bookings')
            .select('room_id, check_in_date, check_out_date')
            .eq('tenant_id', tenantId)
            .in('room_id', roomIds.length > 0 ? roomIds : ['none'])
            .not('status', 'in', '("cancelled","expired","no_show")')
            .lte('check_in_date', endDate)
            .gte('check_out_date', startDate);

        const availabilityMap: Record<string, { total_rooms: number; booked_rooms: number; status: string }> = {};
        let current = parseISO(startDate);
        const end = parseISO(endDate);

        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const bookedCount = (bookings || []).filter(b =>
                b.check_in_date <= dateStr && b.check_out_date > dateStr
            ).length;

            const available = totalRooms - bookedCount;
            let status = 'available';
            if (available === 0) status = 'full';
            else if (available <= Math.ceil(totalRooms * 0.3)) status = 'limited';

            availabilityMap[dateStr] = { total_rooms: totalRooms, booked_rooms: bookedCount, status };
            current = addDays(current, 1);
        }

        return NextResponse.json({ success: true, data: availabilityMap });
    }
);

export const OPTIONS = createV1Options();
