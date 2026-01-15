import { NextRequest, NextResponse } from 'next/server';
import { uploadToTikTok } from '@/lib/tiktok-uploader';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const sessionId = formData.get('sessionId') as string;
        const caption = formData.get('caption') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Save file locally
        // We'll save to public/uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${uuidv4()}_${file.name}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, buffer);

        // Upload to TikTok using Puppeteer
        const result = await uploadToTikTok(filePath, sessionId, caption);

        // Optional: Clean up file after upload to save space
        // fs.unlinkSync(filePath);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Upload failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('File Upload API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
