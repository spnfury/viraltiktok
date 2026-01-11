import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
    downloadTikTok,
    extractAudio,
    extractKeyFrames,
    extractHighDensityFrames,
    getVideoMetadata,
    cleanup,
    getTempDir,
} from '@/lib/video-processor';
import {
    transcribeAudio,
    analyzeFrame,
    generateContextAnalysis,
    generateSoraPrompts,
    detectHook,
    analyzeTimingPatterns,
    type FrameAnalysis,
} from '@/lib/ai-analyzer';

export const maxDuration = 300; // 5 minutes max for processing

export async function POST(request: NextRequest) {
    let tempDir: string | null = null;
    let videoPath: string | null = null;
    let audioPath: string | null = null;
    let framesDir: string | null = null;

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

        // Create temporary directory
        tempDir = getTempDir();
        await fs.mkdir(tempDir, { recursive: true });

        // Step 1: Download TikTok video
        videoPath = path.join(tempDir, 'video.mp4');
        await downloadTikTok(url, videoPath);

        // Step 2: Get video metadata
        const metadata = await getVideoMetadata(videoPath);

        // Step 3: Extract audio
        audioPath = await extractAudio(videoPath);

        // Step 4: Extract key frames (every 2 seconds)
        framesDir = path.join(tempDir, 'frames');
        const framePaths = await extractKeyFrames(videoPath, framesDir, 2);

        // Step 5: Transcribe audio with Whisper
        const transcription = await transcribeAudio(audioPath, keyOwner);

        // Step 6: Analyze frames with GPT-4 Vision
        const frameAnalyses: FrameAnalysis[] = [];
        for (let i = 0; i < framePaths.length; i++) {
            const framePath = framePaths[i];
            const timestamp = i * 2; // 2 seconds interval
            const frameBuffer = await fs.readFile(framePath);
            const analysis = await analyzeFrame(frameBuffer, timestamp, keyOwner);
            frameAnalyses.push(analysis);
        }

        // Step 6.5: Extract and analyze high-density frames for hook detection (0-3s)
        const hookFramesDir = path.join(tempDir, 'hook_frames');
        const hookFramePaths = await extractHighDensityFrames(videoPath, hookFramesDir);

        const hookFrameBuffers = [];
        for (const hookFramePath of hookFramePaths) {
            const buffer = await fs.readFile(hookFramePath);
            // Extract timestamp from filename like "hook_frame_0_0s.jpg"
            const match = hookFramePath.match(/hook_frame_\d+_(\d+\.?\d*)s\.jpg/);
            const timestamp = match ? parseFloat(match[1]) : 0;
            hookFrameBuffers.push({ buffer, timestamp });
        }

        const hookAnalysis = await detectHook(hookFrameBuffers, transcription, keyOwner);

        // Step 7: Generate context analysis
        const context = await generateContextAnalysis(
            transcription,
            frameAnalyses,
            metadata,
            keyOwner
        );

        // Step 7.5: Analyze timing patterns
        const timingPatterns = await analyzeTimingPatterns(frameAnalyses, metadata);

        // Step 8: Generate Sora prompts - SKIPPED FOR PHASE 1
        // User requested strictly no Sora prompting during initial analysis to save costs/avoid quota errors.
        // The frontend will handle prompt generation on demand or via deterministic builder.
        const soraPrompts = {
            main: '',
            variations: [],
            technical: null
        };

        // Step 9: Create timeline
        const timeline = frameAnalyses.map((frame, index) => ({
            timestamp: frame.timestamp,
            description: frame.description,
            duration: index < frameAnalyses.length - 1
                ? frameAnalyses[index + 1].timestamp - frame.timestamp
                : metadata.duration - frame.timestamp,
        }));

        // Cleanup temporary files
        await cleanup([tempDir]);

        // Return results
        return NextResponse.json({
            success: true,
            data: {
                transcription,
                visualAnalysis: frameAnalyses,
                context,
                hookAnalysis,
                timingPatterns,
                soraPrompts,
                timeline,
                metadata: {
                    duration: metadata.duration,
                    resolution: `${metadata.width}x${metadata.height}`,
                    fps: metadata.fps,
                },
            },
        });
    } catch (error) {
        // Cleanup on error
        if (tempDir) {
            await cleanup([tempDir]);
        }

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
