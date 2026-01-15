'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GenerationProgress from '@/components/GenerationProgress';
import VideoPlayer from '@/components/VideoPlayer';

function GenerateContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
    const [progress, setProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    const handleUpload = async () => {
        if (!id) return;
        setIsUploading(true);
        setUploadStatus(null);

        try {
            // Get session ID from local storage if available
            const sessionId = localStorage.getItem('tiktok_session_id');

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: id, // Assuming the ID maps to the filename
                    caption: `${prompt.substring(0, 100)}... #fyp #viral`, // Simple caption
                    sessionId
                })
            });

            const result = await response.json();
            if (result.success) {
                setUploadStatus({ success: true, message: '¡Video subido a TikTok exitosamente!' });
            } else {
                setUploadStatus({ success: false, message: `Error: ${result.error}` });
            }
        } catch (error) {
            setUploadStatus({ success: false, message: 'Error de conexión al subir.' });
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        let pollInterval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const keyOwner = localStorage.getItem('openai_key_owner') || 'sergio';
                const response = await fetch(`/api/generate/${id}?keyOwner=${keyOwner}`);
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

                {status === 'completed' && videoUrl && (
                    <div className="mt-6 flex flex-col items-center gap-4 fade-in">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className={`btn-secondary flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="spinner w-4 h-4"></div>
                                    Subiendo a TikTok...
                                </>
                            ) : (
                                <>
                                    <span>🎵</span> Subir a TikTok (@brainrotclipsreal)
                                </>
                            )}
                        </button>

                        {uploadStatus && (
                            <div className={`text-sm p-3 rounded-lg border ${uploadStatus.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                {uploadStatus.message}
                            </div>
                        )}
                    </div>
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

export default function GeneratePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        }>
            <GenerateContent />
        </Suspense>
    );
}
