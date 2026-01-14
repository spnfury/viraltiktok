'use client';

import { useState } from 'react';

interface PromptEditorProps {
    mainPrompt: string;
    variations: string[];
    onGenerate?: (prompt: string) => void;
}

export default function PromptEditor({ mainPrompt, variations, onGenerate }: PromptEditorProps) {
    const [activePrompt, setActivePrompt] = useState(mainPrompt);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(activePrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setActivePrompt(mainPrompt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePrompt === mainPrompt
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Prompt Principal
                </button>
                {variations.map((v, i) => (
                    <button
                        key={i}
                        onClick={() => setActivePrompt(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activePrompt === v
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        Variación {i + 1}
                    </button>
                ))}
            </div>

            <div className="relative">
                <textarea
                    value={activePrompt}
                    onChange={(e) => setActivePrompt(e.target.value)}
                    placeholder="El prompt se generará automáticamente con todo el contexto del análisis cuando hagas clic en 'Generar con Sora'. También puedes escribir tu propio prompt aquí."
                    className="w-full h-64 p-6 glass text-zinc-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 glass hover:bg-purple-500/20 transition-colors rounded-lg group"
                    title="Copiar al portapapeles"
                >
                    {copied ? (
                        <span className="text-xs text-green-400 font-bold px-2">¡Copiado!</span>
                    ) : (
                        <svg
                            className="w-5 h-5 text-zinc-400 group-hover:text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                        </svg>
                    )}
                </button>
            </div>

            <div className="flex gap-4">
                {onGenerate && (
                    <button
                        onClick={() => onGenerate(activePrompt)}
                        className="flex-1 btn-primary py-3 rounded-xl font-medium shadow-lg shadow-purple-500/20"
                    >
                        🎬 Generar con Sora
                    </button>
                )}
                <button className="flex-1 btn-secondary glass py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
                    Descargar TXT
                </button>
            </div>
        </div>
    );
}
