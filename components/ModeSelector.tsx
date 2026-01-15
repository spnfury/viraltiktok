'use client';

interface ModeSelectorProps {
    mode: 'tiktok' | 'prompt' | 'upload' | 'creator';
    onModeChange: (mode: 'tiktok' | 'prompt' | 'upload' | 'creator') => void;
}

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
    return (
        <div className="flex p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl max-w-2xl mx-auto mb-8">
            <button
                onClick={() => onModeChange('tiktok')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'tiktok'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">📱</span>
                <span className="hidden sm:inline">TikTok</span>
            </button>
            <button
                onClick={() => onModeChange('prompt')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'prompt'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">✨</span>
                <span className="hidden sm:inline">Sora</span>
            </button>
            <button
                onClick={() => onModeChange('creator')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'creator'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">🎬</span>
                <span className="hidden sm:inline">Editor</span>
            </button>
            <button
                onClick={() => onModeChange('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${mode === 'upload'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
            >
                <span className="text-lg">📤</span>
                <span className="hidden sm:inline">Subir</span>
            </button>
        </div>
    );
}
