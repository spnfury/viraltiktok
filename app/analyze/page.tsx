'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PromptEditor from '@/components/PromptEditor';
import FrameCarousel from '@/components/FrameCarousel';
import Timeline from '@/components/Timeline';

interface AnalysisData {
    transcription: string;
    visualAnalysis: any[];
    context: {
        videoType: string;
        style: string;
        pacing: string;
        hooks: string[];
        dominantColors: string[];
        mood: string;
        targetAudience: string;
    };
    soraPrompts: {
        main: string;
        variations: string[];
        technical: any;
        segments: any[];
    };
    timeline: any[];
    metadata: {
        duration: number;
        resolution: string;
        fps: number;
    };
}

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');

    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('prompts');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!url) return;

        const analyzeVideo = async () => {
            try {
                setLoading(true);
                // Fake progress since API might take a while
                const progressInterval = setInterval(() => {
                    setProgress(prev => (prev < 90 ? prev + 1 : prev));
                }, 1000);

                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });

                const result = await response.json();
                clearInterval(progressInterval);

                if (result.success) {
                    setData(result.data);
                    setProgress(100);
                } else {
                    setError(result.error || 'Ocurrió un error inesperado');
                }
            } catch (err) {
                setError('Error de conexión con el servidor');
            } finally {
                setLoading(false);
            }
        };

        analyzeVideo();
    }, [url]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✨</div>
                </div>
                <div className="text-center space-y-4 max-w-md">
                    <h2 className="text-2xl font-bold gradient-text">Analizando tu TikTok...</h2>
                    <p className="text-zinc-400">
                        Estamos descargando el video, transcribiendo audio y analizando frames con IA. Esto puede tomar un momento.
                    </p>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">{progress}% completado</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="text-6xl text-red-500">❌</div>
                <h2 className="text-2xl font-bold text-white">Error en el análisis</h2>
                <p className="text-zinc-400 max-w-md">{error}</p>
                <Link href="/" className="btn-primary">
                    Intentar de nuevo
                </Link>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al inicio
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Context */}
                <div className="space-y-6">
                    <div className="glass p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                            <span>📊</span> Resumen del Video
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-zinc-500 uppercase font-bold block">Tipo</span>
                                <span className="text-white capitalize">{data.context.videoType}</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 uppercase font-bold block">Estilo</span>
                                <span className="text-white">{data.context.style}</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 uppercase font-bold block">Ritmo</span>
                                <span className="text-white capitalize">{data.context.pacing}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-zinc-500 uppercase font-bold block">Duración</span>
                                    <span className="text-white">{data.metadata.duration.toFixed(1)}s</span>
                                </div>
                                <div>
                                    <span className="text-xs text-zinc-500 uppercase font-bold block">Formato</span>
                                    <span className="text-white">{data.metadata.resolution}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6">
                        <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-zinc-500">Hooks Encontrados</h3>
                        <ul className="space-y-2">
                            {data.context.hooks.map((hook, i) => (
                                <li key={i} className="text-sm text-zinc-300 flex gap-2">
                                    <span className="text-purple-500">•</span> {hook}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('prompts')}
                        >
                            Prompts Sora
                        </button>
                        <button
                            className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
                            onClick={() => setActiveTab('visual')}
                        >
                            Análisis Visual
                        </button>
                        <button
                            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
                            onClick={() => setActiveTab('timeline')}
                        >
                            Timeline
                        </button>
                        <button
                            className={`tab ${activeTab === 'transcription' ? 'active' : ''}`}
                            onClick={() => setActiveTab('transcription')}
                        >
                            Transcripción
                        </button>
                    </div>

                    <div className="fade-in">
                        {activeTab === 'prompts' && (
                            <PromptEditor
                                mainPrompt={data.soraPrompts.main}
                                variations={data.soraPrompts.variations}
                                onGenerate={async (prompt) => {
                                    try {
                                        const response = await fetch('/api/generate', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                prompt,
                                                options: {
                                                    duration: Math.round(data.metadata.duration),
                                                    aspectRatio: data.metadata.resolution.includes('x') &&
                                                        parseInt(data.metadata.resolution.split('x')[1]) > parseInt(data.metadata.resolution.split('x')[0])
                                                        ? '9:16' : '16:9',
                                                    model: 'sora-2'
                                                }
                                            }),
                                        });

                                        const result = await response.json();
                                        if (result.success) {
                                            window.location.href = `/generate?id=${result.data.generationId}`;
                                        } else {
                                            alert(`Error: ${result.error}`);
                                        }
                                    } catch (err) {
                                        console.error('Generation error:', err);
                                        alert('Error al conectar con el servidor');
                                    }
                                }}
                            />
                        )}

                        {activeTab === 'visual' && (
                            <FrameCarousel frames={data.visualAnalysis} />
                        )}

                        {activeTab === 'timeline' && (
                            <Timeline segments={data.timeline} totalDuration={data.metadata.duration} />
                        )}

                        {activeTab === 'transcription' && (
                            <div className="glass p-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Audio Transcrito</h3>
                                    <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
                                        Procesado por Whisper
                                    </span>
                                </div>
                                <p className="text-zinc-300 leading-relaxed text-lg italic">
                                    "{data.transcription}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AnalyzePage() {
    return (
        <div className="min-h-screen">
            <div className="gradient-bg"></div>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="spinner"></div>
                </div>
            }>
                <AnalyzeContent />
            </Suspense>
        </div>
    );
}
