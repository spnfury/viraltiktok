// scripts/bot.ts
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { uploadToTikTok } from '../lib/tiktok-uploader'; // Adjust path if needed
import { getUploadAdvice } from '../lib/ai-analyzer';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN no encontrado en .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot de Telegram iniciado en modo polling...');

// Set commands for the menu button
bot.setMyCommands([
    { command: '/start', description: 'Iniciar el bot y ver menú' },
    { command: '/help', description: 'Ayuda y soporte' }
]);

const mainMenuAttributes = {
    reply_markup: {
        keyboard: [
            [{ text: '📤 Subir Video' }, { text: '⚙️ Estado' }],
            [{ text: '❓ Ayuda' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Handle Video or Document (MP4)
    if (msg.video || (msg.document && msg.document.mime_type === 'video/mp4')) {
        // ... (video handling logic remains the same, assuming it's inside the if block above)
        // Optimization: Refactor video handling to a separate function or keep it if it's clear
        // reusing existing logic.
        // For this edit, I will paste the previous video logic but I need to be careful with the ReplaceFileContent range.
        // Since I'm replacing the whole 'message' handler block, I'll copy the logic.

        const fileId = msg.video?.file_id || msg.document?.file_id;
        if (!fileId) return;

        bot.sendMessage(chatId, '📥 Video recibido. Descargando...', { reply_to_message_id: msg.message_id });

        try {
            const downloadPath = await bot.downloadFile(fileId, './public/uploads');

            let finalPath = downloadPath;
            if (!finalPath.endsWith('.mp4')) {
                const newPath = `${downloadPath}.mp4`;
                fs.renameSync(downloadPath, newPath);
                finalPath = newPath;
            }

            const caption = msg.caption || msg.text || '#fyp #viral';

            bot.sendMessage(chatId, '🚀 Subiendo a TikTok... (abriendo navegador)');

            const sessionId = process.env.TIKTOK_SESSION_ID;
            if (!sessionId) {
                bot.sendMessage(chatId, '❌ Error: Falta TIKTOK_SESSION_ID en .env');
                return;
            }

            const result = await uploadToTikTok(finalPath, sessionId, caption);

            if (result.success) {
                bot.sendMessage(chatId, '✅ ¡Video subido a TikTok exitosamente!', mainMenuAttributes);
            } else {
                if (result.error?.includes('TIKTOK_RESTRICTION')) {
                    const reason = result.error.replace('TIKTOK_RESTRICTION:', '').trim();
                    bot.sendMessage(chatId, `⚠️ **TikTok rechazó el video**\n\nRazón: _${reason}_\n\n🧠 **Analizando solución con IA...**`, { parse_mode: 'Markdown', ...mainMenuAttributes });

                    try {
                        const { advice, tips } = await getUploadAdvice(reason);
                        const tipsList = tips.map(t => `• ${t}`).join('\n');
                        const adviceMsg = `🤖 **Análisis del Bot**\n\n${advice}\n\n🛠 **Tips para arreglarlo:**\n${tipsList}`;
                        bot.sendMessage(chatId, adviceMsg, { parse_mode: 'Markdown', ...mainMenuAttributes });
                    } catch (aiErr) {
                        bot.sendMessage(chatId, 'No pude generar consejos específicos, pero intenta editar el video.', mainMenuAttributes);
                    }

                } else {
                    bot.sendMessage(chatId, `❌ Error al subir: ${result.error}`, mainMenuAttributes);
                }
            }

            try { fs.unlinkSync(finalPath); } catch (e) { }

        } catch (error: any) {
            console.error('Error procesando video:', error);
            if (error.message.includes('TIKTOK_RESTRICTION')) {
                const reason = error.message.replace('TIKTOK_RESTRICTION:', '').trim();
                bot.sendMessage(chatId, `⚠️ **TikTok rechazó el video**\n\nRazón: _${reason}_\n\n🧠 **Analizando solución con IA...**`, { parse_mode: 'Markdown', ...mainMenuAttributes });

                try {
                    const { advice, tips } = await getUploadAdvice(reason);
                    const tipsList = tips.map(t => `• ${t}`).join('\n');
                    const adviceMsg = `🤖 **Análisis del Bot**\n\n${advice}\n\n🛠 **Tips para arreglarlo:**\n${tipsList}`;
                    bot.sendMessage(chatId, adviceMsg, { parse_mode: 'Markdown', ...mainMenuAttributes });
                } catch (aiErr) {
                    // silent fail
                }
            } else {
                bot.sendMessage(chatId, `❌ Hubo un error técnico: ${error.message}`, mainMenuAttributes);
            }
        }
        return;
    }

    // Handle Text Commands
    if (text === '/start') {
        bot.sendMessage(chatId, '👋 **¡Hola! Soy tu asistente de TikTok.**\n\nUsa el menú de abajo para interactuar.', { parse_mode: 'Markdown', ...mainMenuAttributes });
    }
    else if (text === '📤 Subir Video') {
        bot.sendMessage(chatId, '🎥 **Modo Subida**\n\nSimplemente envíame o reenvíame un video MP4 aquí mismo y yo me encargo del resto.\n\nPuedes añadir un comentario al video y lo usaré como descripción.', mainMenuAttributes);
    }
    else if (text === '⚙️ Estado') {
        const hasSession = !!process.env.TIKTOK_SESSION_ID;
        const msg = hasSession
            ? '✅ **Sistema Operativo**\n\nLa sesión de TikTok está configurada.'
            : '❌ **Alerta**\n\nNo se detecta TIKTOK_SESSION_ID. Por favor configúralo en el archivo .env.';
        bot.sendMessage(chatId, msg, { parse_mode: 'Markdown', ...mainMenuAttributes });
    }
    else if (text === '❓ Ayuda') {
        bot.sendMessage(chatId, '🆘 **Ayuda**\n\n1. Pulsa "📤 Subir Video".\n2. Adjunta tu archivo MP4.\n3. Añade un texto (opcional) para el caption.\n4. Espera mi confirmación.', mainMenuAttributes);
    }
    else if (text) {
        // Echo or ignore
        // bot.sendMessage(chatId, 'Usa el menú para seleccionar una opción.', mainMenuAttributes);
    }
});
