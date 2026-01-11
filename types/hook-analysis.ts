/**
 * Type definitions for TikTok Hook Analysis System
 * Analyzes viral hooks and timing patterns in the first 3 seconds
 */

/**
 * Types of hooks commonly found in viral TikTok videos
 */
export type HookType =
    | 'visual'      // Striking visual element, unusual imagery
    | 'verbal'      // Attention-grabbing opening line or question
    | 'text'        // Eye-catching text overlay
    | 'movement'    // Dynamic camera movement or action
    | 'sound'       // Distinctive audio/music start
    | 'mixed';      // Combination of multiple hook types

/**
 * Intensity/strength rating of the hook
 */
export type HookStrength =
    | 'low'         // Mild attention grabber (30-50% retention)
    | 'medium'      // Good hook (50-70% retention)
    | 'high'        // Strong hook (70-85% retention)
    | 'extreme';    // Viral-tier hook (85%+ retention)

/**
 * Comprehensive analysis of the video's hook (0-3 seconds)
 */
export interface HookAnalysis {
    /** Exact timestamp where the strongest hook element occurs */
    timestamp: number;

    /** Primary type of hook detected */
    type: HookType;

    /** Intensity rating of the hook */
    strength: HookStrength;

    /** Detailed description of what makes this hook effective */
    description: string;

    /** Key elements that contribute to the hook's effectiveness */
    keyElements: string[];

    /** Actionable tips for replicating this hook in Sora */
    replicationTips: string[];

    /** Visual cues (colors, composition, objects) that grab attention */
    visualCues?: string[];

    /** Audio cues (music, sound effects, voice tone) that enhance hook */
    audioCues?: string[];

    /** Confidence score 0-1 for the hook detection accuracy */
    confidence: number;
}

/**
 * Timing pattern detection for scene changes and pacing
 */
export interface TimingPattern {
    /** Time range where this pattern occurs [start, end] in seconds */
    timeRange: [number, number];

    /** Type of change detected */
    changeType: 'scene' | 'audio' | 'pace' | 'text' | 'transition';

    /** How significant is this change */
    significance: 'minor' | 'moderate' | 'major';

    /** Description of what changed */
    description: string;

    /** Why this timing matters for virality */
    impact?: string;
}

/**
 * Frame comparison result for detecting visual changes
 */
export interface FrameDifference {
    /** Timestamp of the compared frames */
    timestamp: number;

    /** Percentage of visual change (0-100) */
    changePercentage: number;

    /** What changed between frames */
    changeDescription: string;

    /** Whether this represents a significant scene change */
    isSceneChange: boolean;
}
