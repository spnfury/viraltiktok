import type { FrameAnalysis, ContextAnalysis } from './ai-analyzer';

interface EnrichedPromptData {
    mainPrompt: string;
    transcription: string;
    visualAnalysis: FrameAnalysis[];
    context: ContextAnalysis;
    timeline: any[];
}

/**
 * Builds an enriched prompt for Sora that includes all analysis context
 * and Spanish language requirements
 */
export function buildEnrichedSoraPrompt(data: EnrichedPromptData): string {
    const { mainPrompt, transcription, visualAnalysis, context, timeline } = data;

    // Extract key visual moments
    const keyMoments = visualAnalysis
        .slice(0, 5) // Top 5 key frames
        .map((frame, i) => `${i + 1}. [${frame.timestamp}s] ${frame.description}`)
        .join('\n');

    // Build timeline summary
    const timelineSummary = timeline
        .slice(0, 3) // First 3 segments
        .map((seg, i) => `${i + 1}. ${seg.description}`)
        .join('\n');

    // Construct the enriched prompt
    const enrichedPrompt = `${mainPrompt}

IMPORTANT LANGUAGE REQUIREMENT:
- All spoken dialogue, narration, and on-screen text MUST be in SPANISH (español).
- Any text overlays, captions, or written content should be in Spanish.
- Character speech and voice-overs must be in Spanish.

CONTEXT FROM ORIGINAL VIDEO:
Audio Transcription: "${transcription}"

Visual Style & Mood:
- Video Type: ${context.videoType}
- Style: ${context.style}
- Pacing: ${context.pacing}
- Mood: ${context.mood}
- Dominant Colors: ${context.dominantColors.join(', ')}

Key Visual Moments:
${keyMoments}

Narrative Flow:
${timelineSummary}

Target Audience: ${context.targetAudience}

CREATE A VIDEO that captures these elements while ensuring ALL TEXT AND DIALOGUE IS IN SPANISH.`;

    return enrichedPrompt;
}
