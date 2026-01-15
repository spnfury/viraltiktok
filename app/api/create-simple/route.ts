import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Lazy initialization to avoid build-time errors
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_SERGIO;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const musicFile = formData.get('music') as File | null;
        const script = formData.get('script') as string;
        const voice = (formData.get('voice') as string) || 'alloy';

        if (!videoFile || !script) {
            return NextResponse.json({ success: false, error: 'Faltan datos requeridos (video o guion)' }, { status: 400 });
        }

        const id = uuidv4();
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        // 1. Save Video
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const videoPath = path.join(uploadsDir, `${id}_bg.mp4`);
        fs.writeFileSync(videoPath, videoBuffer);

        // 2. Save Music (if any)
        let musicPath = '';
        if (musicFile) {
            const musicBuffer = Buffer.from(await musicFile.arrayBuffer());
            musicPath = path.join(uploadsDir, `${id}_music.mp3`);
            fs.writeFileSync(musicPath, musicBuffer);
        }

        // 3. Generate TTS Audio
        const speechPath = path.join(uploadsDir, `${id}_speech.mp3`);
        const openai = getOpenAIClient();
        const mp3Response = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: script,
        });
        const buffer = Buffer.from(await mp3Response.arrayBuffer());
        fs.writeFileSync(speechPath, buffer);

        // 4. Combine with ffmpeg
        // Strategy:
        // - Text-to-Speech is the master duration.
        // - Background video loops to match TTS duration.
        // - Music is mixed with TTS (volume 0.2 vs 1.0).
        // - Output final MP4.

        const outputPath = path.join(uploadsDir, `${id}_final.mp4`);

        await new Promise((resolve, reject) => {
            let command = ffmpeg();

            // Input 1: Video (stream 0)
            command.input(videoPath).inputOptions(['-stream_loop -1']); // Loop video indefinitely

            // Input 2: Speech (stream 1)
            command.input(speechPath);

            // Input 3: Music (stream 2) (optional)
            if (musicPath) {
                command.input(musicPath);
            }

            const complexFilter = [];
            // Audio mixing
            if (musicPath) {
                // Mix speech (1:a) and music (2:a)
                // Speech volume 1.0, Music volume 0.1
                complexFilter.push('[2:a]volume=0.1[music];[1:a]volume=1.0[speech];[speech][music]amix=inputs=2:duration=shortest[audio_out]');
            } else {
                complexFilter.push('[1:a]volume=1.0[audio_out]');
            }

            // Using stream 0:v (video) and [audio_out]
            // We cut the video to the duration of the speech (stream 1) roughly
            // Actually 'duration=shortest' in amix works for audio, but for video we need to limit it.
            // A safer way is to use `-t` based on the speech duration, but probing is async.
            // Simpler ffmpeg trick: `-shortest` (stops when the shortest stream ends).
            // But if video is looped, it's infinite. Speech is finite.
            // So if we map video and speech, `-shortest` should stop at speech end.

            command
                .complexFilter(complexFilter)
                .outputOptions([
                    '-map 0:v',           // Use video from input 0
                    '-map [audio_out]',   // Use mixed audio
                    '-shortest',          // Stop when shortest input ends (should be speech)
                    '-c:v libx264',       // Re-encode video for compatibility
                    '-c:a aac',           // AAC audio
                    '-pix_fmt yuv420p',   // Ensure compatibility
                    '-movflags +faststart' // Web optimization
                ])
                .output(outputPath)
                .on('end', () => resolve(true))
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Cleanup
        try {
            fs.unlinkSync(videoPath);
            fs.unlinkSync(speechPath);
            if (musicPath) fs.unlinkSync(musicPath);
        } catch (e) { console.error('Cleanup error', e); }

        return NextResponse.json({
            success: true,
            videoUrl: `/uploads/${id}_final.mp4`
        });

    } catch (error: any) {
        console.error('Create video error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
