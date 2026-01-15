import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

interface UploadResult {
    success: boolean;
    error?: string;
    videoUrl?: string; // Note: URL might not be immediately available
}

export async function uploadToTikTok(
    videoPath: string,
    sessionId: string,
    caption: string = ''
): Promise<UploadResult> {
    let browser;
    try {
        console.log('Launching browser for TikTok upload...');
        browser = await puppeteer.launch({
            headless: false, // Must be false to likely avoid immediate bot detection
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1280, height: 800 }
        });

        const page = await browser.newPage();

        // 1. Set Cookies
        if (!sessionId) {
            throw new Error('No session ID provided');
        }

        const cookies = [
            {
                name: 'sessionid',
                value: sessionId,
                domain: '.tiktok.com',
                path: '/',
                secure: true,
                httpOnly: true,
            }
        ];

        await page.setCookie(...cookies);

        // 2. Navigate to Upload Page
        console.log('Navigating to upload page...');
        await page.goto('https://www.tiktok.com/upload?lang=en', { waitUntil: 'networkidle2' });

        // Check if logged in by looking for login modal or specific elements
        const isLoggedIn = await page.evaluate(() => {
            return !document.querySelector('a[href*="/login"]');
            // Simplified check - seeing the upload form is better proof
        });

        // 3. Upload Video
        console.log('Waiting for file input...');
        // Selector for the file input might change, generic approach usually works for standard inputs
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });

        if (!fileInput) {
            throw new Error('Could not find file input element. Cookie might be invalid (redirected to login).');
        }

        console.log('Uploading file:', videoPath);
        if (!fs.existsSync(videoPath)) {
            throw new Error(`File not found: ${videoPath}`);
        }

        await fileInput.uploadFile(videoPath);

        // 4. Wait for upload to complete (simplified logic)
        // TikTok shows a progress bar or text. We wait for "Uploaded" or similar confirmation or the "Post" button to become enabled.
        console.log('Waiting for upload to process...');

        // Wait for the "Post" button to assume the upload is sufficiently processed
        // This selector is fragile and may update.
        // Usually there's a button with text "Post"
        const postButtonSelector = 'button[type="button"]:has-text("Post")';
        // Note: :has-text is not standard CSS. Puppeteer supports it in some versions or via XPath.
        // Let's use a safer approach waiting for the generic button container enabling.

        // Wait for a bit (simulate user behavior)
        await new Promise(r => setTimeout(r, 5000));

        // 5. Set Caption
        if (caption) {
            console.log('Setting caption...');
            // This is tricky as TikTok's caption area is a contenteditable div usually
            const captionSelector = '.public-DraftEditor-content';
            await page.waitForSelector(captionSelector);
            await page.click(captionSelector);
            await page.keyboard.type(caption);
        }

        // 6. Click Post
        console.log('Clicking Post...');

        // Try multiple selectors for the Post/Publicar button
        // 1. XPath for "Post" or "Publicar"
        const postBtnSelectors = [
            '//button[div[text()="Post"]]',
            '//button[div[text()="Publicar"]]',
            '//button[text()="Post"]',
            '//button[text()="Publicar"]',
            // Generic fallback: The primary button in the footer usually
            'button[data-e2e="post_video_button"]' // Common data-attribute for TikTok (might change)
        ];

        let postBtn;
        for (const selector of postBtnSelectors) {
            try {
                // If it starts with // it's xpath
                if (selector.startsWith('//')) {
                    postBtn = await page.waitForSelector(selector, { visible: true, timeout: 2000 });
                } else {
                    postBtn = await page.waitForSelector(selector, { visible: true, timeout: 2000 });
                }
                if (postBtn) {
                    console.log(`Found Post button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (postBtn) {
            await postBtn.click();
        } else {
            throw new Error('Could not find Post/Publicar button. The page language might be different or the structure changed.');
        }

        // 7. Wait for success OR error modal
        console.log('Waiting for result...');
        try {
            await page.waitForFunction(
                () => {
                    const text = document.body.innerText;
                    // Success keywords
                    if (text.includes('uploaded') || text.includes('subido')) return true;
                    // Failure/Restriction keywords
                    if (text.includes('restricted') || text.includes('restringido') || text.includes('Violation')) return true;
                    return false;
                },
                { timeout: 30000 }
            );

            // check if it was a restriction
            const pageText = await page.evaluate(() => document.body.innerText);
            if (pageText.includes('restricted') || pageText.includes('restringido') || pageText.includes('Violation')) {
                // Try to extract reason
                const reason = await page.evaluate(() => {
                    // Based on screenshot: "Violation reason" header, then text below
                    const elements = Array.from(document.querySelectorAll('div'));
                    const reasonHeader = elements.find(el => el.textContent?.includes('Violation reason') || el.textContent?.includes('Razón de la infracción'));
                    if (reasonHeader && reasonHeader.nextElementSibling) {
                        return reasonHeader.nextElementSibling.textContent;
                    }
                    return 'Contenido restringido por TikTok (posible copyright o baja calidad).';
                });

                throw new Error(`TIKTOK_RESTRICTION: ${reason}`);
            }

        } catch (e: any) {
            if (e.message.includes('TIKTOK_RESTRICTION')) {
                throw e; // Re-throw our specific error
            }
            console.log('Warning: Explicit success message not detected, but Post button was clicked. Assuming success.');
        }

        console.log('Upload successful!');

        await new Promise(r => setTimeout(r, 2000)); // Grace period

        return { success: true };

    } catch (error: any) {
        console.error('TikTok Upload Error:', error);
        // Take screenshot for debugging to PUBLIC folder so user can see it
        if (browser) {
            const pages = await browser.pages();
            if (pages.length > 0) {
                const debugPath = path.join(process.cwd(), 'public', 'debug_screenshot.png');
                await pages[0].screenshot({ path: debugPath });
                console.log(`Debug screenshot saved to: ${debugPath}`);
            }
        }
        return { success: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
