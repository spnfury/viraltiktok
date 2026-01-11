import OpenAI from 'openai';

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    return new OpenAI({
        apiKey: apiKey || 'dummy_key_for_build',
    });
};

const openai = getOpenAIClient();

export interface SoraGenerationOptions {
    model?: string;
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    resolution?: '720p' | '1080p';
}

export interface SoraVideo {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    prompt: string;
    createdAt: number;
    error?: string;
}

const getSoraClient = (client: any) => {
    const paths = [
        { name: 'beta.videoGenerations', value: client.beta?.videoGenerations },
        { name: 'beta.video_generations', value: client.beta?.video_generations },
        { name: 'videos.generations', value: client.videos?.generations },
        { name: 'videoGenerations', value: client.videoGenerations },
        { name: 'video_generations', value: client.video_generations },
        { name: 'videos', value: client.videos }
    ];

    for (const { value } of paths) {
        if (value && typeof value.create === 'function') {
            return value; // Found valid client
        }
    }
    return null;
};

/**
 * Initiates a Sora video generation
 */
export async function generateSoraVideo(prompt: string, options: SoraGenerationOptions = {}): Promise<string> {
    const sora = getSoraClient(openai);

    if (!sora) {
        console.error('Available OpenAI keys:', Object.keys(openai).filter(k => !k.startsWith('_')));
        throw new Error('Could not find Sora video generation method in OpenAI SDK. Please check SDK version.');
    }

    try {
        const response = await sora.create({
            model: options.model || 'sora-2',
            prompt: prompt,
            size: options.aspectRatio === '9:16' ? '720x1280' : '1280x720',
            // Note: Sora API specifics might vary based on exact SDK version, 
            // but this follows the general OpenAI generation pattern.
        });

        return response.id;
    } catch (error: any) {
        console.error('Sora generation error:', error);
        throw new Error(error.message || 'Failed to start Sora generation');
    }
}

/**
 * Checks the status of a Sora generation
 */
export async function getSoraStatus(generationId: string): Promise<SoraVideo> {
    const sora = getSoraClient(openai);

    if (!sora) {
        throw new Error('Sora client not found for status retrieval');
    }

    try {
        const response = await sora.retrieve(generationId);

        return {
            id: response.id,
            status: response.status,
            videoUrl: response.video?.url,
            prompt: response.prompt,
            createdAt: response.created_at,
            error: response.error?.message
        };
    } catch (error: any) {
        console.error('Sora status check error:', error);
        throw new Error(error.message || 'Failed to check Sora status');
    }
}

/**
 * Lists recent Sora generations
 */
export async function listSoraGenerations() {
    const sora = getSoraClient(openai);
    if (!sora) return [];

    try {
        const response = await sora.list({ limit: 20 });
        return response.data;
    } catch (error: any) {
        console.error('Sora list error:', error);
        return [];
    }
}
