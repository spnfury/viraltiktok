'use client';

interface ModeSelectorProps {
    mode: 'tiktok' | 'prompt';
    onModeChange: (mode: 'tiktok' | 'prompt') => void;
}

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
    return (
        <div className="flex p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl max-w-sm mx-auto mb-8">
            <button
                onClick={() => onModeChange('tiktok')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'tiktok'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">📱</span>
                Analizar TikTok
            </button>
            <button
                onClick={() => onModeChange('prompt')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'prompt'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">✨</span>
                Desde Prompt
            </button>
        </div>
    );
}
