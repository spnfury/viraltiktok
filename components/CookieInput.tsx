'use client';
import { useState } from 'react';

export default function CookieInput() {
    const [sessionId, setSessionId] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const saveCookie = () => {
        // In a real app, this should probably be saved to a secure backend or .env
        // For this local tool, we could save to localStorage to pass it to the API
        localStorage.setItem('tiktok_session_id', sessionId);
        alert('Session ID saved to local storage (for this browser session)!');
        setSessionId('');
    };

    return (
        <div className="glass p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-zinc-300">🎵 TikTok Session ID</h3>
                <button onClick={() => setIsVisible(!isVisible)} className="text-xs text-purple-400">
                    {isVisible ? 'Hide' : 'Show'}
                </button>
            </div>
            {isVisible && (
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        placeholder="Paste sessionid cookie here..."
                        className="input-field text-sm"
                    />
                    <button onClick={saveCookie} className="btn-secondary text-sm px-3">
                        Save
                    </button>
                </div>
            )}
            <p className="text-xs text-zinc-500 mt-2">
                Required for auto-upload. Retrieving from <code>.env</code> is preferred.
            </p>
        </div>
    );
}
