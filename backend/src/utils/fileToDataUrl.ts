import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * Converts a file on disk to a base64 data URL.
 * @param filePath - Absolute or project-relative path to the file.
 * @returns A data URL string.
 */
export function fileToDataUrl(filePath: string): string {
  // Resolve to absolute path
  const normalizedPath = filePath.startsWith('/uploads/')
    ? filePath.slice(1)
    : filePath;

  const absPath = path.isAbsolute(normalizedPath)
    ? normalizedPath
    : path.resolve(process.cwd(), normalizedPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`[fileToDataUrl] File not found at "${absPath}"`);
  }

  const ext = path.extname(absPath).toLowerCase();
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';
  const buffer = fs.readFileSync(absPath);

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
