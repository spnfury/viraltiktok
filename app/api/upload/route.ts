import { NextRequest, NextResponse } from 'next/server';
import { uploadToTikTok } from '@/lib/tiktok-uploader';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoId, caption, sessionId } = body;

        if (!videoId) {
            return NextResponse.json(
                { success: false, error: 'videoId is required' },
                { status: 400 }
            );
        }

        // Validate Session ID (either from body or env)
        const finalSessionId = sessionId || process.env.TIKTOK_SESSION_ID;
        if (!finalSessionId) {
            return NextResponse.json(
                { success: false, error: 'TIKTOK_SESSION_ID is not configured and not provided in request' },
                { status: 401 }
            );
        }

        // Construct video path
        // Check both potential locations: public/videos or a local 'videos' root folder
        // For now assuming a standard location based on typical project structure
        // Adjust this path based on where 'viraltiktok' actually saves files
        const videoPath = path.join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);

        // Use the library function
        const result = await uploadToTikTok(videoPath, finalSessionId, caption);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Upload failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, daa: result });

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
