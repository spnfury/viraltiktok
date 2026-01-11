'use client';

import type { HookAnalysis } from '@/types/hook-analysis';

interface TimelineSegment {
    timestamp: number;
    description: string;
    duration: number;
}

interface TimelineProps {
    segments: TimelineSegment[];
    totalDuration: number;
    hookAnalysis?: HookAnalysis;
}

export default function Timeline({ segments, totalDuration, hookAnalysis }: TimelineProps) {
    return (
        <div className="relative py-8">
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-zinc-800"></div>

            <div className="space-y-8">
                {segments.map((segment, i) => {
                    // Check if this segment is in the hook zone (0-3s)
                    const isInHookZone = segment.timestamp <= 3;
                    const isHookMoment = hookAnalysis &&
                        segment.timestamp <= hookAnalysis.timestamp &&
                        (i === segments.length - 1 || segments[i + 1].timestamp > hookAnalysis.timestamp);

                    return (
                        <div key={i} className="relative pl-10 group">
                            {/* Timeline dot - golden for hook zone */}
                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 group-hover:scale-110 transition-transform ${isHookMoment
                                    ? 'bg-yellow-500 border-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse'
                                    : isInHookZone
                                        ? 'bg-zinc-900 border-yellow-500'
                                        : 'bg-zinc-900 border-purple-500'
                                }`}>
                                {isHookMoment && (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs">
                                        ⚡
                                    </span>
                                )}
                            </div>

                            <div className={`glass p-4 group-hover:bg-zinc-800/50 transition-colors ${isInHookZone ? 'border-l-2 border-yellow-500/30' : ''
                                }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`font-mono font-bold ${isInHookZone ? 'text-yellow-400' : 'text-purple-400'
                                        }`}>
                                        {Math.floor(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-zinc-500 text-xs">— {segment.duration.toFixed(1)}s</span>

                                    {/* Hook Zone Badge */}
                                    {isInHookZone && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-400 font-bold">
                                            HOOK ZONE
                                        </span>
                                    )}

                                    {/* Hook Moment Indicator */}
                                    {isHookMoment && (
                                        <span className="px-2 py-0.5 bg-yellow-500 rounded text-xs text-black font-bold animate-pulse">
                                            ⚡ HOOK PRINCIPAL
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    {segment.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pl-10">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Fin del Video — {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}s
                </div>
            </div>
        </div>
    );
}
