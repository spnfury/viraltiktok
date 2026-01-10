'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GenerationProgress from '@/components/GenerationProgress';
import VideoPlayer from '@/components/VideoPlayer';

export default function GeneratePage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
    const [progress, setProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let pollInterval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/generate/${id}`);
                const result = await response.json();

                if (result.success) {
                    const data = result.data;
                    setStatus(data.status);
                    setPrompt(data.prompt);

                    if (data.status === 'completed' && data.videoUrl) {
                        setVideoUrl(data.videoUrl);
                        clearInterval(pollInterval);
                    } else if (data.status === 'failed') {
                        setError(data.error || 'Generation failed');
                        clearInterval(pollInterval);
                    }

                    // Simulate progress for UI
                    if (data.status === 'processing') {
                        setProgress(prev => Math.min(prev + 5, 95));
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // Initial check
        checkStatus();

        // Start polling
        pollInterval = setInterval(checkStatus, 5000);

        return () => clearInterval(pollInterval);
    }, [id]);

    if (!id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Error de Navegación</h1>
                    <p className="text-zinc-400 mb-6 font-mono">No se encontró ID de generación.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn-primary w-full"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            <div className="gradient-bg"></div>

            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-12">
                    Generando con <span className="gradient-text">Sora</span>
                </h1>

                {status !== 'completed' && !error && (
                    <GenerationProgress
                        status={status}
                        progress={progress}
                        prompt={prompt || 'Cargando prompt...'}
                    />
                )}

                {status === 'completed' && videoUrl && (
                    <VideoPlayer url={videoUrl} prompt={prompt} />
                )}

                {error && (
                    <div className="glass p-10 max-w-2xl mx-auto text-center space-y-6 fade-in border-red-500/20">
                        <div className="text-5xl">⚠️</div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">Error en la Generación</h2>
                            <p className="text-zinc-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 font-mono">
                                {error}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-primary w-full"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}

                {/* Info panel */}
                {status !== 'completed' && (
                    <div className="mt-12 glass p-6 text-sm text-zinc-400 text-left max-w-2xl mx-auto border-l-4 border-purple-500">
                        <p><strong>¿Sabías que?</strong> Sora no solo genera imágenes, sino que simula la física del mundo real para crear movimientos fluidos y coherentes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
