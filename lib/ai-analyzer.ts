import OpenAI from 'openai';
import fs from 'fs/promises';
import type { VideoMetadata } from './video-processor';
import type { HookAnalysis, HookType, HookStrength, TimingPattern, FrameDifference } from '@/types/hook-analysis';

export type OpenAIKeyOwner = 'sergio' | 'ruben';

export const getOpenAIClient = (keyOwner?: OpenAIKeyOwner) => {
    let apiKey = process.env.OPENAI_API_KEY;

    // Use specific key if owner is specified
    if (keyOwner === 'sergio') {
        apiKey = process.env.OPENAI_API_KEY_SERGIO;
    } else if (keyOwner === 'ruben') {
        apiKey = process.env.OPENAI_API_KEY_RUBEN;
    }

    if (!apiKey && process.env.NODE_ENV === 'production') {
        // Return a dummy client or handle it in the calling functions
        // For now, we'll initialize but calls will fail if no key provided
    }
    return new OpenAI({
        apiKey: apiKey || 'dummy_key_for_build',
    });
};

// Default client - will be overridden in functions

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
export async function transcribeAudio(audioPath: string, keyOwner?: 'sergio' | 'ruben'): Promise<string> {
    const openai = getOpenAIClient(keyOwner);
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
    timestamp: number,
    keyOwner?: 'sergio' | 'ruben'
): Promise<FrameAnalysis> {
    const openai = getOpenAIClient(keyOwner);
    try {
        const base64Image = frameBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Using full model for vision reliability
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
    } catch (error: any) {
        console.error(`Frame analysis error at ${timestamp}s:`, error);
        const isQuotaError = error.status === 429 || error.code === 'insufficient_quota';
        return {
            timestamp,
            description: isQuotaError ? 'Error: Cuota de OpenAI agotada' : 'Analysis failed',
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
    metadata: VideoMetadata,
    keyOwner?: 'sergio' | 'ruben'
): Promise<ContextAnalysis> {
    const openai = getOpenAIClient(keyOwner);
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
            model: 'gpt-4o-mini',
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
    } catch (error: any) {
        console.error('Context analysis error:', error);
        const isQuotaError = error.status === 429 || error.code === 'insufficient_quota';
        return {
            videoType: isQuotaError ? 'Error de Cuota' : 'unknown',
            style: isQuotaError ? 'Revisa tu API Key' : 'standard',
            pacing: 'medium',
            hooks: [],
            dominantColors: [],
            mood: 'neutral',
            targetAudience: 'general',
        };
    }
}

/**
 * Detects and analyzes the hook in the first 3 seconds of the video
 * Analyzes high-density frames (every 0.5s) to identify viral hook elements
 */
export async function detectHook(
    hookFrameBuffers: Array<{ buffer: Buffer; timestamp: number }>,
    transcription: string,
    keyOwner?: 'sergio' | 'ruben'
): Promise<HookAnalysis> {
    const openai = getOpenAIClient(keyOwner);

    try {
        // Convert frame buffers to base64 for GPT-4 Vision
        const frameImages = hookFrameBuffers.map(({ buffer, timestamp }) => ({
            timestamp,
            base64: buffer.toString('base64')
        }));

        // Create prompt for hook analysis
        const prompt = `Analyze these frames from the first 3 seconds of a TikTok video to identify the HOOK.

The hook is the attention-grabbing element that makes viewers STOP scrolling.

Frames analyzed: ${frameImages.map(f => f.timestamp + 's').join(', ')}
Transcription: ${transcription || '[No audio/transcription]'}

Analyze and provide JSON with:
1. timestamp: Exact second where the STRONGEST hook element appears (0-3)
2. type: Primary hook type (visual/verbal/text/movement/sound/mixed)
3. strength: Hook intensity (low/medium/high/extreme)
4. description: What makes this hook effective (2-3 sentences)
5. keyElements: Array of 3-5 specific elements that grab attention
6. replicationTips: Array of 3-5 actionable tips for recreating this hook in Sora
7. visualCues: Array of visual elements (colors, objects, composition)
8. audioCues: Array of audio elements (if applicable)
9. confidence: Your confidence in this analysis (0-1)

Be specific and actionable. Focus on WHAT makes viewers stop scrolling.`;

        // Build messages with images
        const imageContents = frameImages.map(({ timestamp, base64 }) => ([
            {
                type: 'text' as const,
                text: `Frame at ${timestamp}s:`
            },
            {
                type: 'image_url' as const,
                image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                    detail: 'high' as const
                }
            }
        ])).flat();

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        ...imageContents
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content || '{}';
        const parsed = JSON.parse(content);

        return {
            timestamp: parsed.timestamp || 0,
            type: parsed.type || 'visual',
            strength: parsed.strength || 'medium',
            description: parsed.description || 'Hook detected',
            keyElements: Array.isArray(parsed.keyElements) ? parsed.keyElements : [],
            replicationTips: Array.isArray(parsed.replicationTips) ? parsed.replicationTips : [],
            visualCues: Array.isArray(parsed.visualCues) ? parsed.visualCues : undefined,
            audioCues: Array.isArray(parsed.audioCues) ? parsed.audioCues : undefined,
            confidence: parsed.confidence || 0.7
        };
    } catch (error: any) {
        console.error('Hook detection error:', error);
        const isQuotaError = error.status === 429 || error.code === 'insufficient_quota';
        return {
            timestamp: 0,
            type: 'visual',
            strength: 'low',
            description: isQuotaError ? 'Error: Cuota de OpenAI agotada en esta llave' : 'Hook detection failed',
            keyElements: [],
            replicationTips: [],
            confidence: 0
        };
    }
}

/**
 * Analyzes timing patterns by detecting scene changes and pacing shifts
 */
export async function analyzeTimingPatterns(
    frameAnalyses: FrameAnalysis[],
    metadata: VideoMetadata
): Promise<TimingPattern[]> {
    const patterns: TimingPattern[] = [];

    // Analyze consecutive frames for significant changes
    for (let i = 1; i < frameAnalyses.length; i++) {
        const prevFrame = frameAnalyses[i - 1];
        const currFrame = frameAnalyses[i];

        // Detect scene changes based on object/composition differences
        const objectsChanged = currFrame.objects.filter(obj =>
            !prevFrame.objects.includes(obj)
        ).length;

        const compositionChanged = prevFrame.composition !== currFrame.composition;
        const colorsChanged = currFrame.colors.filter(color =>
            !prevFrame.colors.includes(color)
        ).length;

        // Significant visual change detected
        if (objectsChanged > 2 || compositionChanged || colorsChanged > 2) {
            patterns.push({
                timeRange: [prevFrame.timestamp, currFrame.timestamp],
                changeType: 'scene',
                significance: objectsChanged > 3 ? 'major' : compositionChanged ? 'moderate' : 'minor',
                description: `Scene change: ${prevFrame.description} → ${currFrame.description}`,
                impact: prevFrame.timestamp < 3
                    ? 'Critical hook window - this change affects viewer retention'
                    : 'Mid-video transition - maintains engagement'
            });
        }

        // Detect pacing changes based on action density
        const prevActions = prevFrame.actions.length;
        const currActions = currFrame.actions.length;

        if (Math.abs(prevActions - currActions) > 2) {
            patterns.push({
                timeRange: [prevFrame.timestamp, currFrame.timestamp],
                changeType: 'pace',
                significance: 'moderate',
                description: currActions > prevActions
                    ? 'Pace increase - more action/movement'
                    : 'Pace decrease - calmer moment',
                impact: 'Pacing variation keeps viewer engaged'
            });
        }
    }

    return patterns;
}

/**
 * Generates Sora-optimized prompts with hook-aware instructions
 */
export async function generateSoraPrompts(
    transcription: string,
    frameAnalyses: FrameAnalysis[],
    context: ContextAnalysis,
    metadata: VideoMetadata,
    hookAnalysis?: any, // HookAnalysis type
    keyOwner?: 'sergio' | 'ruben'
): Promise<SoraPrompt> {
    const openai = getOpenAIClient(keyOwner);
    try {
        const ratio = metadata.height > metadata.width ? '9:16' : '16:9';
        const duration = `${Math.round(metadata.duration)}s`;
        const colors = Array.isArray(context.dominantColors) ? context.dominantColors.join(', ') : 'vibrant colors';

        // Build hook-specific instructions
        let hookInstructions = '';
        if (hookAnalysis && hookAnalysis.timestamp !== undefined) {
            hookInstructions = `\n\nCRITICAL HOOK ANALYSIS (0-3 seconds):\n- Hook Type: ${hookAnalysis.type}\n- Hook Strength: ${hookAnalysis.strength}\n- Hook Timestamp: ${hookAnalysis.timestamp}s\n- Key Elements: ${hookAnalysis.keyElements?.join(', ') || 'N/A'}\n- Replication Tips: ${hookAnalysis.replicationTips?.join(' | ') || 'N/A'}\n\nThe FIRST 3 SECONDS are CRITICAL. Focus heavily on replicating these hook elements:\n${hookAnalysis.description}`;
        }

        const prompt = `You are an expert at creating prompts for Sora AI video generation.

Given this TikTok analysis, create a detailed Sora prompt to recreate a similar video:

Context:
- Type: ${context.videoType}
- Style: ${context.style}
- Pacing: ${context.pacing}
- Mood: ${context.mood}
- Colors: ${colors}${hookInstructions}

Transcription: ${transcription}

Frame breakdown:
${frameAnalyses.map(f => `[${f.timestamp}s] ${f.description}`).join('\n')}

Create:
1. main: A comprehensive 2-3 paragraph Sora prompt describing the entire video. 
   START with the hook (0-3s) in extreme detail, then describe the rest.
2. variations: 2 alternative prompts with different creative directions
3. technical: { duration: "${duration}", ratio: "${ratio}", cameraMovement: "describe", style: "visual aesthetic" }
4. segments: Break video into time segments, with extra detail on the 0-3s hook segment

Format as JSON. Make prompts vivid, specific, and actionable for Sora. 
PRIORITIZE the hook - it determines if viewers watch the rest.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using mini version to reduce costs (~60x cheaper)
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        return JSON.parse(content);
    } catch (error: any) {
        console.error('Sora prompt generation error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            type: error.type
        });

        // Return a basic fallback with error info
        throw new Error(`Failed to generate Sora prompt: ${error.message || 'Unknown error'}`);
    }
}
