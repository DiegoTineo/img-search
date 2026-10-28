import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';

function sanitizeFolderName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

function resolveExtension(contentType: string | undefined, url: string): string {
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('svg')) return '.svg';
  }

  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      return ext;
    }
  } catch {
    // fallback
  }

  return '.jpg';
}

export async function downloadImage(url: string, destFilePath: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    const ext = resolveExtension(response.headers['content-type'], url);
    const finalPath = destFilePath.endsWith(ext) ? destFilePath : `${destFilePath}${ext}`;

    await pipeline(response.data, createWriteStream(finalPath));
    return true;
  } catch {
    return false;
  }
}

export async function downloadImagesForQuery(
  baseOutputDir: string,
  query: string,
  imageUrls: string[],
  maxDownloads: number = 5
): Promise<number> {
  const folderName = sanitizeFolderName(query);
  const targetDir = path.join(baseOutputDir, folderName);
  await fs.mkdir(targetDir, { recursive: true });

  let downloadedCount = 0;

  for (const url of imageUrls) {
    if (downloadedCount >= maxDownloads) break;

    const filePrefix = String(downloadedCount + 1).padStart(2, '0');
    const destinationBase = path.join(targetDir, `img_${filePrefix}`);

    const success = await downloadImage(url, destinationBase);
    if (success) {
      downloadedCount++;
    }
  }

  return downloadedCount;
}
