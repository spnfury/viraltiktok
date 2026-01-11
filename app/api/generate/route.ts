import { NextRequest, NextResponse } from 'next/server';
import { generateSoraVideo } from '@/lib/sora-generator';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { prompt, options, keyOwner } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Validate OpenAI API key based on owner or default
        const apiKey = keyOwner === 'sergio'
            ? process.env.OPENAI_API_KEY_SERGIO
            : keyOwner === 'ruben'
                ? process.env.OPENAI_API_KEY_RUBEN
                : process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: `OpenAI API key not configured${keyOwner ? ` for ${keyOwner}` : ''}. Please add it to Vercel Environment Variables.`
                },
                { status: 500 }
            );
        }

        const generationId = await generateSoraVideo(prompt, {
            ...options,
            keyOwner
        });

        // Save to Supabase if configured
        if (supabase) {
            const { error } = await supabase.from('videos').insert({
                generation_id: generationId,
                prompt: prompt,
                status: 'pending',
                aspect_ratio: options?.aspectRatio || '16:9',
                duration: options?.duration || 15,
                model: options?.model || 'sora-2'
            });
            if (error) console.error('Supabase insert error:', error);
        }

        return NextResponse.json({
            success: true,
            data: {
                generationId,
                status: 'pending'
            }
        });
    } catch (error: any) {
        console.error('Generate API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to initiate video generation'
            },
            { status: 500 }
        );
    }
}
