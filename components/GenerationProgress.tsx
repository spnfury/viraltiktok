'use client';

interface GenerationProgressProps {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    prompt: string;
}

export default function GenerationProgress({ status, progress = 0, prompt }: GenerationProgressProps) {
    const getStatusMessage = () => {
        switch (status) {
            case 'pending': return 'Tu video está en cola...';
            case 'processing': return `Generando frames cinematográficos... ${progress}%`;
            case 'completed': return '¡Video generado con éxito!';
            case 'failed': return 'Hubo un error en la generación.';
            default: return 'Cargando...';
        }
    };

    return (
        <div className="glass p-10 max-w-2xl mx-auto text-center space-y-8 fade-in">
            <div className="relative w-32 h-32 mx-auto">
                <div className={`absolute inset-0 rounded-full border-4 border-purple-500/20 ${status === 'processing' ? 'animate-ping' : ''}`}></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    {status === 'failed' ? '❌' : status === 'completed' ? '✅' : '🎬'}
                </div>
                {(status === 'pending' || status === 'processing') && (
                    <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                        <circle
                            className="text-purple-500/20"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                            r="58"
                            cx="64"
                            cy="64"
                        />
                        <circle
                            className="text-purple-500 transition-all duration-500"
                            strokeWidth="4"
                            strokeDasharray={364.4}
                            strokeDashoffset={364.4 - (364.4 * progress) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="58"
                            cx="64"
                            cy="64"
                        />
                    </svg>
                )}
            </div>

            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">{getStatusMessage()}</h2>
                <p className="text-zinc-400 text-sm max-w-md mx-auto line-clamp-2 italic">
                    "{prompt}"
                </p>
            </div>

            {status === 'processing' && (
                <div className="space-y-4">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-zinc-500">
                        Sora está renderizando cada frame con IA. Esto puede tomar unos minutos.
                    </p>
                </div>
            )}
        </div>
    );
}
