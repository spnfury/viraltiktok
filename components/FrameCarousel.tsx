'use client';

import { useState } from 'react';

interface FrameAnalysis {
    timestamp: number;
    description: string;
    objects: string[];
    colors: string[];
    composition: string;
}

interface FrameCarouselProps {
    frames: FrameAnalysis[];
}

export default function FrameCarousel({ frames }: FrameCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!frames.length) return null;

    return (
        <div className="space-y-6">
            <div className="relative aspect-video glass overflow-hidden rounded-2xl">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                    <span className="text-zinc-500 italic">Previsualización de Frame {frames[activeIndex].timestamp}s</span>
                    {/* Note: Real image URLs would be served here in a production app */}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {frames[activeIndex].timestamp}s
                        </span>
                        <span className="text-white font-medium">{frames[activeIndex].composition}</span>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed">
                        {frames[activeIndex].description}
                    </p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {frames.map((frame, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeIndex === i ? 'border-purple-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                            }`}
                    >
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                            Frame {frame.timestamp}s
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4">
                    <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Objetos</span>
                    <div className="flex flex-wrap gap-1">
                        {frames[activeIndex].objects.map((obj, i) => (
                            <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                                {obj}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="glass p-4">
                    <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Colores</span>
                    <div className="flex flex-wrap gap-1">
                        {frames[activeIndex].colors.map((color, i) => (
                            <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                                {color}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
