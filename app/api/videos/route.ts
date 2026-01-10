import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({
                success: true,
                data: []
            });
        }

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error: any) {
        console.error('List videos API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch video history' },
            { status: 500 }
        );
    }
}
