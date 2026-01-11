'use client';

import { useState, useEffect } from 'react';

type ApiKeyOwner = 'sergio' | 'ruben';

export default function KeySelector() {
    const [selectedKey, setSelectedKey] = useState<ApiKeyOwner>('sergio');

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('openai_key_owner') as ApiKeyOwner;
        if (saved) setSelectedKey(saved);
    }, []);

    const handleChange = (owner: ApiKeyOwner) => {
        setSelectedKey(owner);
        localStorage.setItem('openai_key_owner', owner);
    };

    return (
        <div className="glass px-4 py-2 flex items-center gap-3 text-sm">
            <span className="text-zinc-400">🔑 API Key:</span>
            <div className="flex gap-2">
                <button
                    onClick={() => handleChange('sergio')}
                    className={`px-3 py-1 rounded-lg transition-all ${selectedKey === 'sergio'
                            ? 'bg-purple-500 text-white font-semibold'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Sergio
                </button>
                <button
                    onClick={() => handleChange('ruben')}
                    className={`px-3 py-1 rounded-lg transition-all ${selectedKey === 'ruben'
                            ? 'bg-purple-500 text-white font-semibold'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Ruben
                </button>
            </div>
        </div>
    );
}

export function getSelectedKeyOwner(): ApiKeyOwner {
    if (typeof window === 'undefined') return 'sergio';
    return (localStorage.getItem('openai_key_owner') as ApiKeyOwner) || 'sergio';
}
