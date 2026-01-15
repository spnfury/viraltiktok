'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleCreator() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [script, setScript] = useState('');
    const [voice, setVoice] = useState('alloy');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [resultUrl, setResultUrl] = useState('');
    const router = useRouter();

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMusicFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile || !script) {
            alert('Por favor sube un video y escribe un guion.');
            return;
        }

        setIsLoading(true);
        setStatus('Preparando archivos...');

        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('script', script);
        formData.append('voice', voice);
        if (musicFile) {
            formData.append('music', musicFile);
        }

        try {
            setStatus('Subiendo y procesando... esto puede tardar unos minutos.');
            const response = await fetch('/api/create-simple', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setStatus('¡Video creado con éxito!');
                setResultUrl(result.videoUrl);
            } else {
                setStatus(`Error: ${result.error}`);
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            setStatus('Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass p-8 max-w-2xl mx-auto mb-12 fade-in">
            <h2 className="text-2xl font-bold mb-6 text-center">🎬 Editor Simple</h2>

            {!resultUrl ? (
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Background Video */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            1. Video de Fondo (MP4/MOV)
                        </label>
                        <div className="relative border-2 border-dashed border-zinc-700/50 rounded-xl p-8 transition-all hover:bg-zinc-800/30 text-center">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-4xl mb-2">📼</div>
                            <p className="font-medium text-white">
                                {videoFile ? videoFile.name : 'Arrastra tu video aquí'}
                            </p>
                        </div>
                    </div>

                    {/* Script / Narration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            2. Guion para Narración (TTS)
                        </label>
                        <textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Escribe lo que quieres que diga la voz..."
                            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-purple-500/50 text-white placeholder-zinc-600"
                            required
                        />
                        <div className="mt-2 flex gap-4">
                            {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map((v) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="voice"
                                        value={v}
                                        checked={voice === v}
                                        onChange={(e) => setVoice(e.target.value)}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs uppercase text-zinc-400">{v}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Background Music (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            3. Música de Fondo (Opcional)
                        </label>
                        <div className="relative border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4 bg-zinc-900/30">
                            <span className="text-2xl">🎵</span>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleMusicChange}
                                    className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-purple-900/20"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <span className="spinner"></span>
                                {status}
                            </span>
                        ) : '✨ Crear Video Mágico'}
                    </button>

                </form>
            ) : (
                <div className="text-center space-y-6">
                    <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden max-w-sm mx-auto shadow-2xl relative">
                        <video
                            src={resultUrl}
                            controls
                            className="w-full h-full object-cover"
                            autoPlay
                        />
                    </div>

                    <div className="flex gap-4 justify-center">
                        <a
                            href={resultUrl}
                            download="mi-video-tiktok.mp4"
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            ⬇️ Descargar
                        </a>
                        <button
                            onClick={() => { setResultUrl(''); setStatus(''); }}
                            className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800/50 rounded-xl font-medium transition-colors"
                        >
                            🔄 Crear Otro
                        </button>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm text-purple-200">
                        ¡Listo! Ahora puedes ir a la pestaña "Subir MP4" para publicarlo en TikTok.
                    </div>
                </div>
            )}
        </div>
    );
}
