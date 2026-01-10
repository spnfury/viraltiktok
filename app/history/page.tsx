'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VideoRecord {
    id: string;
    generation_id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    created_at: string;
}

export default function HistoryPage() {
    const [videos, setVideos] = useState<VideoRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            const result = await response.json();
            if (result.success) {
                setVideos(result.data);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
            <div className="gradient-bg"></div>

            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <Link href="/" className="text-zinc-400 hover:text-white transition-colors mb-4 inline-block">
                            ← Volver al inicio
                        </Link>
                        <h1 className="text-4xl font-bold font-inter">Mi <span className="gradient-text">Biblioteca</span></h1>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="spinner mb-4"></div>
                        <p className="text-zinc-400">Cargando tus creaciones...</p>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="glass p-12 text-center">
                        <div className="text-6xl mb-6">🎬</div>
                        <h2 className="text-2xl font-semibold mb-4">Aún no tienes videos</h2>
                        <p className="text-zinc-400 mb-8">Empieza a crear contenido increíble con Sora AI.</p>
                        <Link href="/" className="btn-primary inline-block">Crear mi primer video</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="glass overflow-hidden card-hover cursor-pointer"
                                onClick={() => router.push(`/generate?id=${video.generation_id}`)}
                            >
                                <div className="aspect-video bg-zinc-900 relative group">
                                    {video.video_url ? (
                                        <video
                                            src={video.video_url}
                                            className="w-full h-full object-cover"
                                            muted
                                            onMouseOver={(e) => e.currentTarget.play()}
                                            onMouseOut={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="spinner"></div>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <StatusBadge status={video.status} />
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="text-sm text-zinc-300 line-clamp-2 italic">
                                        "{video.prompt}"
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/50">
                                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                        <span className="text-purple-400 hover:underline">Ver detalles →</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: VideoRecord['status'] }) {
    const styles = {
        pending: 'bg-zinc-700 text-zinc-300',
        processing: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
        completed: 'bg-green-500/20 text-green-400 border border-green-500/50',
        failed: 'bg-red-500/20 text-red-400 border border-red-500/50'
    };

    const labels = {
        pending: 'En cola',
        processing: 'Procesando',
        completed: 'Listo',
        failed: 'Error'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}
