import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

/**
 * Downloads a TikTok video using yt-dlp
 */
export async function downloadTikTok(url: string, outputPath: string): Promise<string> {
  try {
    const command = `yt-dlp -f "best[ext=mp4]" --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -o "${outputPath}" "${url}"`;
    await execAsync(command);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to download TikTok: ${error}`);
  }
}

/**
 * Extracts audio from video file
 */
export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace('.mp4', '.mp3');

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .on('end', () => resolve(audioPath))
      .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run();
  });
}

/**
 * Extracts key frames from video at specified intervals
 */
export async function extractKeyFrames(
  videoPath: string,
  outputDir: string,
  intervalSeconds: number = 2
): Promise<string[]> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const metadata = await getVideoMetadata(videoPath);
  const framePaths: string[] = [];
  const totalFrames = Math.floor(metadata.duration / intervalSeconds);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', async () => {
        // Get all generated frame files
        const files = await fs.readdir(outputDir);
        const frames = files
          .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
          .sort()
          .map(f => path.join(outputDir, f));
        resolve(frames);
      })
      .on('error', (err) => reject(new Error(`Frame extraction failed: ${err.message}`)))
      .screenshots({
        count: totalFrames,
        folder: outputDir,
        filename: 'frame_%i.jpg',
        size: '1280x?'
      });
  });
}

/**
 * Extracts high-density frames from the first 3 seconds for hook analysis
 * Returns frames at: 0s, 0.5s, 1s, 1.5s, 2s, 2.5s, 3s
 */
export async function extractHighDensityFrames(
  videoPath: string,
  outputDir: string
): Promise<string[]> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const metadata = await getVideoMetadata(videoPath);
  const framePaths: string[] = [];

  // Extract frames at 0, 0.5, 1, 1.5, 2, 2.5, 3 seconds
  const timestamps = [0, 0.5, 1, 1.5, 2, 2.5, 3].filter(t => t <= metadata.duration);

  // Extract each frame at specific timestamp
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const outputPath = path.join(outputDir, `hook_frame_${i}_${timestamp}s.jpg`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: `hook_frame_${i}_${timestamp}s.jpg`,
            folder: outputDir,
            size: '1280x?'
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      framePaths.push(outputPath);
    } catch (error) {
      console.warn(`Failed to extract frame at ${timestamp}s:`, error);
    }
  }

  return framePaths;
}


/**
 * Gets video metadata using ffprobe
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: eval(videoStream.r_frame_rate || '30/1') // e.g., "30/1" -> 30
      });
    });
  });
}

/**
 * Cleans up temporary files
 */
export async function cleanup(paths: string[]): Promise<void> {
  for (const filePath of paths) {
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${filePath}:`, error);
    }
  }
}

/**
 * Generates a unique temporary directory path
 */
export function getTempDir(prefix: string = 'tiktok'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return path.join('/tmp', `${prefix}_${timestamp}_${random}`);
}
