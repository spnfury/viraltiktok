'use client';

interface VideoPlayerProps {
    url: string;
    prompt: string;
}

export default function VideoPlayer({ url, prompt }: VideoPlayerProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `sora-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="glass overflow-hidden rounded-3xl aspect-[9/16] max-w-sm mx-auto shadow-2xl shadow-purple-500/20 relative group">
                <video
                    src={url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <p className="text-white text-sm font-medium line-clamp-3">
                        {prompt}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
                <button
                    onClick={handleDownload}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                    <span>📥</span> Descargar Video
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 btn-secondary glass py-3 rounded-xl flex items-center justify-center gap-2"
                >
                    <span>✨</span> Crear Otro
                </button>
            </div>

            <div className="max-w-xl mx-auto glass p-6 text-left">
                <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-2">Prompt Utilizado</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                    {prompt}
                </p>
            </div>
        </div>
    );
}
