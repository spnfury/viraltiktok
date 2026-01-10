'use client';

interface TimelineSegment {
    timestamp: number;
    description: string;
    duration: number;
}

interface TimelineProps {
    segments: TimelineSegment[];
    totalDuration: number;
}

export default function Timeline({ segments, totalDuration }: TimelineProps) {
    return (
        <div className="relative py-8">
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-zinc-800"></div>

            <div className="space-y-8">
                {segments.map((segment, i) => (
                    <div key={i} className="relative pl-10 group">
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-zinc-900 border-2 border-purple-500 group-hover:scale-110 transition-transform"></div>

                        <div className="glass p-4 group-hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-purple-400 font-mono font-bold">
                                    {Math.floor(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}
                                </span>
                                <span className="text-zinc-500 text-xs">— {segment.duration.toFixed(1)}s</span>
                            </div>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {segment.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pl-10">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Fin del Video — {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}s
                </div>
            </div>
        </div>
    );
}
