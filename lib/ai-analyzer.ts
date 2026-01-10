import OpenAI from 'openai';
import fs from 'fs/promises';
import type { VideoMetadata } from './video-processor';

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey && process.env.NODE_ENV === 'production') {
        // Return a dummy client or handle it in the calling functions
        // For now, we'll initialize but calls will fail if no key provided
    }
    return new OpenAI({
        apiKey: apiKey || 'dummy_key_for_build',
    });
};

const openai = getOpenAIClient();

export interface FrameAnalysis {
    timestamp: number;
    description: string;
    objects: string[];
    colors: string[];
    composition: string;
    actions: string[];
}

export interface ContextAnalysis {
    videoType: string;
    style: string;
    pacing: string;
    hooks: string[];
    dominantColors: string[];
    mood: string;
    targetAudience: string;
}

export interface SoraPrompt {
    main: string;
    variations: string[];
    technical: {
        duration: string;
        ratio: string;
        cameraMovement: string;
        style: string;
    };
    segments?: Array<{
        timeRange: string;
        description: string;
    }>;
}

/**
 * Transcribes audio using OpenAI Whisper
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
    try {
        const audioFile = await fs.readFile(audioPath);
        const audioBlob = new File([audioFile], 'audio.mp3', { type: 'audio/mp3' });

        const transcription = await openai.audio.transcriptions.create({
            file: audioBlob,
            model: 'whisper-1',
            language: 'es', // Spanish - adjust as needed
        });

        return transcription.text;
    } catch (error) {
        console.error('Transcription error:', error);
        return '[Transcription failed]';
    }
}

const cleanJSON = (text: string) => {
    return text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
};

/**
 * Analyzes a single frame using GPT-4 Vision
 */
export async function analyzeFrame(
    frameBuffer: Buffer,
    timestamp: number
): Promise<FrameAnalysis> {
    try {
        const base64Image = frameBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this video frame at timestamp ${timestamp}s. Provide:
1. Brief description of what's happening
2. Main objects/elements visible
3. Dominant colors
4. Composition (close-up, wide shot, etc.)
5. Actions or movements

Format as JSON with keys: description, objects (array), colors (array), composition, actions (array)`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500,
        });

        const content = response.choices[0].message.content || '{}';
        const cleanedContent = cleanJSON(content);
        const parsed = JSON.parse(cleanedContent);

        return {
            timestamp,
            description: parsed.description || '',
            objects: Array.isArray(parsed.objects) ? parsed.objects : [],
            colors: Array.isArray(parsed.colors) ? parsed.colors : [],
            composition: parsed.composition || '',
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        };
    } catch (error) {
        console.error(`Frame analysis error at ${timestamp}s:`, error);
        return {
            timestamp,
            description: 'Analysis failed',
            objects: [],
            colors: [],
            composition: '',
            actions: [],
        };
    }
}

/**
 * Generates context analysis from all collected data
 */
export async function generateContextAnalysis(
    transcription: string,
    frameAnalyses: FrameAnalysis[],
    metadata: VideoMetadata
): Promise<ContextAnalysis> {
    try {
        const prompt = `Analyze this TikTok video and provide context:

Video Duration: ${metadata.duration}s
Dimensions: ${metadata.width}x${metadata.height}
FPS: ${metadata.fps}

Transcription:
${transcription}

Frame-by-frame analysis:
${frameAnalyses.map(f => `[${f.timestamp}s] ${f.description} - Objects: ${f.objects.join(', ')}`).join('\n')}

Provide a JSON analysis with:
1. videoType: (tutorial, entertainment, storytelling, product-demo, dance, transition, etc.)
2. style: Overall visual style
3. pacing: (fast, medium, slow)
4. hooks: Array of attention-grabbing elements in first 3 seconds
5. dominantColors: Top 3-5 colors throughout video
6. mood: Overall emotional tone
7. targetAudience: Who this content is for`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        const parsed = JSON.parse(content);

        return {
            videoType: parsed.videoType || 'unknown',
            style: parsed.style || 'standard',
            pacing: parsed.pacing || 'medium',
            hooks: Array.isArray(parsed.hooks) ? parsed.hooks : [],
            dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : [],
            mood: parsed.mood || 'neutral',
            targetAudience: parsed.targetAudience || 'general',
        };
    } catch (error) {
        console.error('Context analysis error:', error);
        return {
            videoType: 'unknown',
            style: 'standard',
            pacing: 'medium',
            hooks: [],
            dominantColors: [],
            mood: 'neutral',
            targetAudience: 'general',
        };
    }
}

/**
 * Generates Sora-optimized prompts
 */
export async function generateSoraPrompts(
    transcription: string,
    frameAnalyses: FrameAnalysis[],
    context: ContextAnalysis,
    metadata: VideoMetadata
): Promise<SoraPrompt> {
    try {
        const ratio = metadata.height > metadata.width ? '9:16' : '16:9';
        const duration = `${Math.round(metadata.duration)}s`;
        const colors = Array.isArray(context.dominantColors) ? context.dominantColors.join(', ') : 'vibrant colors';

        const prompt = `You are an expert at creating prompts for Sora AI video generation.

Given this TikTok analysis, create a detailed Sora prompt to recreate a similar video:

Context:
- Type: ${context.videoType}
- Style: ${context.style}
- Pacing: ${context.pacing}
- Mood: ${context.mood}
- Colors: ${colors}

Transcription: ${transcription}

Frame breakdown:
${frameAnalyses.map(f => `[${f.timestamp}s] ${f.description}`).join('\n')}

Create:
1. main: A comprehensive 2-3 paragraph Sora prompt describing the entire video
2. variations: 2 alternative prompts with different creative directions
3. technical: { duration: "${duration}", ratio: "${ratio}", cameraMovement: "describe", style: "visual aesthetic" }
4. segments: Break video into 3-5 time segments with specific descriptions

Format as JSON. Make prompts vivid, specific, and actionable for Sora.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        return JSON.parse(content);
    } catch (error) {
        console.error('Sora prompt generation error:', error);
        return {
            main: 'Failed to generate prompt',
            variations: [],
            technical: {
                duration: `${Math.round(metadata.duration)}s`,
                ratio: metadata.height > metadata.width ? '9:16' : '16:9',
                cameraMovement: 'static',
                style: 'standard',
            },
        };
    }
}
