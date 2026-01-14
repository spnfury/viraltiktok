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
    detectHook,
    analyzeTimingPatterns,
    type FrameAnalysis,
} from '@/lib/ai-analyzer';

export interface AnalysisResult {
    transcription: string;
    visualAnalysis: FrameAnalysis[];
    context: any;
    hookAnalysis: any;
    timingPatterns: any;
    soraPrompts: any;
    timeline: any[];
    metadata: {
        duration: number;
        resolution: string;
        fps: number;
    };
}

export async function analyzeVideoService(url: string, keyOwner: 'sergio' | 'ruben' | undefined): Promise<AnalysisResult> {
    let tempDir: string | null = null;
    let videoPath: string | null = null;
    let audioPath: string | null = null;
    let framesDir: string | null = null;

    try {
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
        return {
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
        };

    } catch (error) {
        // Cleanup on error
        if (tempDir) {
            await cleanup([tempDir]);
        }
        throw error;
    }
}
