'use client';

import { useState } from 'react';

interface PromptInputProps {
    onSubmit: (data: { prompt: string; options: any }) => void;
    isLoading: boolean;
}

export default function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState(15);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
    const [model, setModel] = useState('sora-2');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        onSubmit({
            prompt,
            options: {
                duration,
                aspectRatio,
                model
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="fade-in">
            <div className="glass p-8 max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 text-left ml-1">
                        Tu idea para el video
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Un primer plano cinematográfico de un gato naranja astronauta explorando Marte, estilo cyberpunk..."
                        className="input-field min-h-32 py-4 resize-none"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400 text-left ml-1">
                            Duración
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="input-field appearance-none cursor-pointer"
                            disabled={isLoading}
                        >
                            <option value={5}>5 segundos</option>
                            <option value={10}>10 segundos</option>
                            <option value={15}>15 segundos</option>
                            <option value={30}>30 segundos</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400 text-left ml-1">
                            Formato
                        </label>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as any)}
                            className="input-field appearance-none cursor-pointer"
                            disabled={isLoading}
                        >
                            <option value="9:16">Vertical (TikTok)</option>
                            <option value="16:9">Horizontal (YouTube)</option>
                            <option value="1:1">Cuadrado (Instagram)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 text-left ml-1">
                        Modelo Sora
                    </label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setModel('sora-2')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm transition-all ${model === 'sora-2'
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                }`}
                            disabled={isLoading}
                        >
                            Sora 2 (Standard)
                        </button>
                        <button
                            type="button"
                            onClick={() => setModel('sora-2-pro')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm transition-all ${model === 'sora-2-pro'
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                }`}
                            disabled={isLoading}
                        >
                            Sora 2 Pro (HD)
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-primary w-full mt-4"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-3">
                            <div className="spinner"></div>
                            Iniciando generación...
                        </span>
                    ) : (
                        '🚀 Generar Video'
                    )}
                </button>

                <p className="text-xs text-zinc-500 text-center">
                    Costo estimado: {model === 'sora-2-pro' ? `$${(duration * 0.5).toFixed(2)}` : `$${(duration * 0.1).toFixed(2)}`}
                </p>
            </div>
        </form>
    );
}
