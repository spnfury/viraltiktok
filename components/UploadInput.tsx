'use client';

import { useState, useRef } from 'react';

export default function UploadInput() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'video/mp4') {
                alert('Solo se permiten archivos MP4');
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setUploadStatus(null);
        }
    };

    const handleUploadToTikTok = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadStatus(null);

        try {
            const sessionId = localStorage.getItem('tiktok_session_id');
            if (!sessionId) {
                setUploadStatus({ success: false, message: 'Falta configurar el TikTok Session ID (ver arriba)' });
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('sessionId', sessionId);
            formData.append('caption', caption || '#fyp #viral');

            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                setUploadStatus({ success: true, message: '¡Video subido a TikTok exitosamente!' });
            } else {
                setUploadStatus({ success: false, message: `Error: ${result.error}` });
            }
        } catch (error) {
            console.error(error);
            setUploadStatus({ success: false, message: 'Error de conexión' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="glass p-8 max-w-2xl mx-auto fade-in">
            <div
                className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500/50 transition-colors mb-6"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/mp4"
                    className="hidden"
                />

                {file ? (
                    <div className="space-y-4">
                        <div className="text-4xl">📄</div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-4xl">📤</div>
                        <h3 className="text-xl font-bold">Sube tu video MP4</h3>
                        <p className="text-zinc-400">Click para seleccionar o arrastra aquí</p>
                    </div>
                )}
            </div>

            {previewUrl && (
                <div className="mb-6">
                    <video src={previewUrl} controls className="w-full rounded-xl" />
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Descripción (Caption)</label>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="#fyp #viral #tiktok"
                    className="input-field min-h-[100px]"
                />
            </div>

            <button
                onClick={handleUploadToTikTok}
                disabled={!file || isUploading}
                className={`btn-primary w-full ${(!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isUploading ? (
                    <span className="flex items-center justify-center gap-3">
                        <div className="spinner"></div>
                        Subiendo a TikTok...
                    </span>
                ) : (
                    '🚀 Subir a TikTok (@brainrotclipsreal)'
                )}
            </button>

            {uploadStatus && (
                <div className={`mt-6 p-4 rounded-xl text-center font-medium ${uploadStatus.success
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {uploadStatus.message}
                </div>
            )}
        </div>
    );
}
