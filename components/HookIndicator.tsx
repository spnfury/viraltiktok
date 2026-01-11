'use client';

import type { HookAnalysis } from '@/types/hook-analysis';

interface HookIndicatorProps {
    hookAnalysis: HookAnalysis;
}

// Icon mapping for hook types
const hookIcons: Record<string, string> = {
    visual: '👁️',
    verbal: '💬',
    text: '📝',
    movement: '🎬',
    sound: '🔊',
    mixed: '✨'
};

// Color mapping for hook strength
const strengthColors: Record<string, string> = {
    low: 'from-zinc-600 to-zinc-700',
    medium: 'from-yellow-600 to-orange-600',
    high: 'from-orange-600 to-red-600',
    extreme: 'from-red-600 to-pink-600'
};

const strengthLabels: Record<string, string> = {
    low: 'Leve',
    medium: 'Bueno',
    high: 'Fuerte',
    extreme: 'VIRAL'
};

export default function HookIndicator({ hookAnalysis }: HookIndicatorProps) {
    const icon = hookIcons[hookAnalysis.type] || '✨';
    const strengthColor = strengthColors[hookAnalysis.strength] || strengthColors.medium;
    const strengthLabel = strengthLabels[hookAnalysis.strength] || hookAnalysis.strength;

    // Calculate strength percentage for visual meter
    const strengthPercentage = {
        low: 25,
        medium: 50,
        high: 75,
        extreme: 100
    }[hookAnalysis.strength] || 50;

    return (
        <div className="glass p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{icon}</span>
                    <div>
                        <h3 className="text-lg font-bold text-white">Hook Detectado</h3>
                        <p className="text-sm text-zinc-400">
                            {hookAnalysis.timestamp.toFixed(1)}s • Tipo: {hookAnalysis.type}
                        </p>
                    </div>
                </div>

                {/* Strength Badge */}
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${strengthColor} text-white font-bold text-sm shadow-lg`}>
                    {strengthLabel}
                </div>
            </div>

            {/* Strength Meter */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Intensidad del Hook
                    </span>
                    <span className="text-xs font-mono text-purple-400">
                        {Math.round(hookAnalysis.confidence * 100)}% confianza
                    </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${strengthColor} transition-all duration-500 ease-out`}
                        style={{ width: `${strengthPercentage}%` }}
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <h4 className="text-sm font-bold text-purple-400 mb-2">¿Por qué funciona?</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                    {hookAnalysis.description}
                </p>
            </div>

            {/* Key Elements */}
            {hookAnalysis.keyElements && hookAnalysis.keyElements.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-purple-400 mb-2">Elementos Clave</h4>
                    <div className="flex flex-wrap gap-2">
                        {hookAnalysis.keyElements.map((element, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-zinc-800/50 rounded-full text-xs text-zinc-300 border border-zinc-700"
                            >
                                {element}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Replication Tips */}
            {hookAnalysis.replicationTips && hookAnalysis.replicationTips.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-purple-400 mb-2">
                        💡 Tips para Replicar en Sora
                    </h4>
                    <ul className="space-y-2">
                        {hookAnalysis.replicationTips.map((tip, i) => (
                            <li
                                key={i}
                                className="text-sm text-zinc-300 flex items-start gap-2"
                            >
                                <span className="text-purple-500 mt-0.5">▸</span>
                                <span className="flex-1">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Visual & Audio Cues */}
            <div className="grid grid-cols-2 gap-4">
                {hookAnalysis.visualCues && hookAnalysis.visualCues.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Visual Cues
                        </h4>
                        <div className="space-y-1">
                            {hookAnalysis.visualCues.map((cue, i) => (
                                <div key={i} className="text-xs text-zinc-400">
                                    • {cue}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hookAnalysis.audioCues && hookAnalysis.audioCues.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Audio Cues
                        </h4>
                        <div className="space-y-1">
                            {hookAnalysis.audioCues.map((cue, i) => (
                                <div key={i} className="text-xs text-zinc-400">
                                    • {cue}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
