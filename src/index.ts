import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSearchQueries, saveResults } from './fileUtils.js';
import { scrapeBingImages } from './bingScraper.js';
import { downloadImagesForQuery } from './imageDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_PER_QUERY = 5;

async function main(): Promise<void> {
  const rootDir = path.resolve(__dirname, '..');
  const inputFile = path.join(rootDir, 'buscar.txt');
  const outputFile = path.join(rootDir, 'resultado_imagenes.json');
  const imgsDir = path.join(rootDir, 'imgs');

  const queries = await readSearchQueries(inputFile);
  if (queries.length === 0) {
    console.warn(`No se encontraron términos de búsqueda en ${inputFile}`);
    return;
  }

  console.log(`Iniciando descarga de imágenes para ${queries.length} términos...\n`);
  const allResults = [];

  for (const [index, query] of queries.entries()) {
    console.log(`[${index + 1}/${queries.length}] Procesando: "${query}"...`);
    try {
      const result = await scrapeBingImages(query, 30);
      const urls = result.images.map(img => img.url);

      const downloaded = await downloadImagesForQuery(
        imgsDir,
        query,
        urls,
        IMAGES_PER_QUERY
      );

      console.log(`  -> Descargadas ${downloaded} imágenes en imgs/${query}`);
      allResults.push({
        query,
        totalFound: result.totalFound,
        downloaded,
        images: result.images,
      });
    } catch (err) {
      console.error(`  -> Error procesando "${query}":`, err);
      allResults.push({ query, totalFound: 0, downloaded: 0, images: [] });
    }
  }

  await saveResults(outputFile, allResults);
  console.log(`\nProceso completado. Imágenes guardadas en la carpeta 'imgs/'.`);
}

main().catch(err => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});
