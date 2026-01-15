import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/telegram';
import { analyzeVideoService } from '@/lib/analysis-service';

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        // Check if it's a message
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            // Handle Video or Document (MP4)
            if (update.message.video || (update.message.document && update.message.document.mime_type === 'video/mp4')) {
                const fileId = update.message.video?.file_id || update.message.document?.file_id;
                const caption = update.message.caption || update.message.text || '#fyp #viral';

                await sendMessage(chatId, '📥 Video recibido. Descargando...');

                try {
                    // 1. Get File Info
                    const { getFile, getFileDownloadUrl } = await import('@/lib/telegram');
                    const fileInfo = await getFile(fileId);

                    if (!fileInfo.ok) {
                        throw new Error('Error getting file info from Telegram');
                    }

                    const downloadUrl = getFileDownloadUrl(fileInfo.result.file_path);

                    // 2. Download File
                    const response = await fetch(downloadUrl);
                    if (!response.ok) throw new Error('Failed to download file');

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // 3. Save locally
                    const { v4: uuidv4 } = await import('uuid');
                    const fs = await import('fs');
                    const path = await import('path');
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }

                    const fileName = `${uuidv4()}.mp4`;
                    const filePath = path.join(uploadsDir, fileName);
                    fs.writeFileSync(filePath, buffer);

                    await sendMessage(chatId, '🚀 Subiendo a TikTok... (esto abrirá el navegador en el servidor)');

                    // 4. Upload to TikTok
                    const { uploadToTikTok } = await import('@/lib/tiktok-uploader');
                    const sessionId = process.env.TIKTOK_SESSION_ID;

                    if (!sessionId) {
                        await sendMessage(chatId, '❌ Error: TIKTOK_SESSION_ID no configurado en el servidor.');
                        return NextResponse.json({ ok: true });
                    }

                    const result = await uploadToTikTok(filePath, sessionId, caption);

                    if (result.success) {
                        await sendMessage(chatId, '✅ ¡Video subido a TikTok exitosamente!');
                    } else {
                        await sendMessage(chatId, `❌ Error al subir: ${result.error}`);
                    }

                    // Cleanup
                    // fs.unlinkSync(filePath); // Optional

                } catch (error: any) {
                    console.error('Telegram video error:', error);
                    await sendMessage(chatId, `❌ Error procesando el video: ${error.message}`);
                }

                return NextResponse.json({ ok: true });
            }

            // Simple URL detection
            if (text) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = text.match(urlRegex);


                if (urls && urls.length > 0) {
                    const tiktokUrl = urls[0];

                    if (tiktokUrl.includes('tiktok.com')) {
                        // Send processing message
                        await sendMessage(chatId, '🎬 Analizando video... esto puede tomar unos minutos.');

                        // Trigger analysis asynchronously (fire and forget for the webhook response,
                        // mostly relevant for locally running instances where timeout might differ, 
                        // but for serverless it's tricky. 
                        // However, we MUST return 200 OK to Telegram quickly.)

                        // Note: In Vercel serverless, "fire and forget" without await might be killed. 
                        // But for this local execution task, it should be fine. Or we can await it if we accept 
                        // that Telegram might retry if we take too long. 
                        // Best practice: Use a background queue, but for now we'll try to await strictly 
                        // or just risk the timeout/retry for simplicity in this iteration.
                        // Given user wants "easier", we'll await it but risk the "retry" from Telegram if > 60s.
                        // Actually, if we await, Telegram will timeout (limit is ~60s?) and retry.
                        // To avoid retries, we should return immediately ideally. 
                        // But correctly implementing background jobs in Next.js requires Inngest/Trigger.dev etc.
                        // For local dev, we will just await it and see.

                        try {
                            const result = await analyzeVideoService(tiktokUrl, 'sergio'); // Defaulting to sergio for bot

                            const summary = `
📊 *Resumen del Video*
Tipo: ${result.context.videoType}
Estilo: ${result.context.style}
Ritmo: ${result.context.pacing}

📝 *Transcripción*:
"${result.transcription.substring(0, 500)}${result.transcription.length > 500 ? '...' : ''}"

🔗 [Ver Análisis Completo](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/analyze?url=${encodeURIComponent(tiktokUrl)})
                         `;

                            await sendMessage(chatId, summary, 'Markdown');

                        } catch (err: any) {
                            console.error('Error processing video for Telegram:', err);
                            await sendMessage(chatId, `❌ Error analizando el video: ${err.message}`);
                        }

                    } else {
                        await sendMessage(chatId, 'Por favor envía un enlace válido de TikTok.');
                    }
                } else {
                    if (text === '/start') {
                        await sendMessage(chatId, 'Hola! Envíame un enlace de TikTok para analizarlo.');
                    }
                }
            }

            return NextResponse.json({ ok: true });
        }
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
