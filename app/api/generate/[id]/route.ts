import { NextRequest, NextResponse } from 'next/server';
import { getSoraStatus } from '@/lib/sora-generator';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Generation ID is required' },
                { status: 400 }
            );
        }

        const status = await getSoraStatus(id);

        // Update Supabase if configured
        if (supabase) {
            const updateData: any = { status: status.status };
            if (status.videoUrl) updateData.video_url = status.videoUrl;

            await supabase
                .from('videos')
                .update(updateData)
                .eq('generation_id', id);
        }

        return NextResponse.json({
            success: true,
            data: status
        });
    } catch (error: any) {
        console.error('Status API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to check generation status'
            },
            { status: 500 }
        );
    }
}
