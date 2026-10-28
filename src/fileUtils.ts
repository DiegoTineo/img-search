import fs from 'node:fs/promises';
import path from 'node:path';

export async function readSearchQueries(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

export async function saveResults(outputPath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}
