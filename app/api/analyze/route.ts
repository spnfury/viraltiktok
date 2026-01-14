import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import {
    analyzeVideoService,
} from '@/lib/analysis-service';

export const maxDuration = 300; // 5 minutes max for processing

export async function POST(request: NextRequest) {
    try {
        const { url, keyOwner } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invalid TikTok URL' },
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

        const data = await analyzeVideoService(url, keyOwner as 'sergio' | 'ruben' | undefined);

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Analysis failed',
            },
            { status: 500 }
        );
    }
}
