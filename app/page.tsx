'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModeSelector from '@/components/ModeSelector';
import PromptInput from '@/components/PromptInput';
import KeySelector from '@/components/KeySelector';

import CookieInput from '@/components/CookieInput';
import UploadInput from '@/components/UploadInput';
import SimpleCreator from '@/components/SimpleCreator';

export default function Home() {
  const [mode, setMode] = useState<'tiktok' | 'prompt' | 'upload' | 'creator'>('tiktok');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    // Navigate to analyze page with URL as query param
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  const handleDirectGenerate = async (data: { prompt: string; options: any }) => {
    setIsLoading(true);
    try {
      // Add Spanish language requirement to prompt
      const promptWithSpanish = `${data.prompt}

IMPORTANT: All spoken dialogue, narration, and on-screen text MUST be in SPANISH (español). Any text overlays, captions, or written content should be in Spanish.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          prompt: promptWithSpanish
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/generate?id=${result.data.generationId}`);
      } else {
        alert(`Error: ${result.error}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error connecting to server');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="gradient-bg"></div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
        {/* Navigation */}
        <nav className="absolute top-8 right-8 z-10 flex gap-4 items-start">
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-4">
              <KeySelector />
              <Link
                href="/history"
                className="glass px-6 py-3 flex items-center gap-2 hover:bg-zinc-800/50 transition-all border-zinc-700/50"
              >
                <span>📚</span>
                <span className="font-semibold">Mi Biblioteca</span>
              </Link>
            </div>
            <CookieInput />
          </div>
        </nav>

        <main className="max-w-4xl w-full text-center fade-in">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              TikTok to{' '}
              <span className="gradient-text">Sora</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {mode === 'tiktok'
                ? 'Analiza cualquier TikTok y genera prompts optimizados para Sora AI.'
                : 'Crea videos cinematográficos directamente desde tu imaginación con Sora.'}
            </p>
          </div>

          {/* Mode Selector */}
          <ModeSelector mode={mode} onModeChange={setMode} />

          {/* Conditional Input Forms */}
          {mode === 'tiktok' ? (
            <form onSubmit={handleAnalyze} className="mb-12 fade-in">
              <div className="glass p-8 max-w-2xl mx-auto">
                <div className="mb-6">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@username/video/..."
                    className="input-field"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="spinner"></div>
                      Analizando...
                    </span>
                  ) : (
                    '✨ Analizar Video'
                  )}
                </button>
              </div>
            </form>
          ) : mode === 'prompt' ? (
            <div className="mb-12">
              <PromptInput onSubmit={handleDirectGenerate} isLoading={isLoading} />
            </div>
          ) : mode === 'upload' ? (
            <div className="mb-12">
              <UploadInput />
            </div>
          ) : (
            <div className="mb-12">
              <SimpleCreator />
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass p-6 card-hover">
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="text-xl font-semibold mb-2">Transcripción</h3>
              <p className="text-gray-400">
                Whisper AI extrae el audio completo con precisión
              </p>
            </div>

            <div className="glass p-6 card-hover">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-semibold mb-2">Análisis Visual</h3>
              <p className="text-gray-400">
                GPT-4 Vision analiza cada frame del video
              </p>
            </div>

            <div className="glass p-6 card-hover">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-2">Generación Sora</h3>
              <p className="text-gray-400">
                Crea videos increíbles a partir de texto en segundos
              </p>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="glass p-6 text-left">
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-purple-400">💡 Nota:</strong> {mode === 'tiktok'
                  ? 'El análisis puede tomar 1-3 minutos dependiendo de la duración del video.'
                  : 'La generación de video con Sora puede tomar entre 2 y 5 minutos.'}
                Asegúrate de tener configurada tu API Key de OpenAI.
              </p>
            </div>
          </div>
        </main>

        <footer className="absolute bottom-4 text-zinc-500 text-sm">
          © 2026 ViralTikTok AI Agent
        </footer>
      </div>
    </>
  );
}

