import axios from 'axios';

export interface ScrapedImage {
  url: string;
  sourceUrl?: string;
  title?: string;
}

export interface QueryResult {
  query: string;
  totalFound: number;
  images: ScrapedImage[];
}

export async function scrapeBingImages(query: string, limit: number = 30): Promise<QueryResult> {
  const encodedQuery = encodeURIComponent(query);
  const targetUrl = `https://www.bing.com/images/search?q=${encodedQuery}&form=HDRSC2&first=1`;

  const response = await axios.get(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    timeout: 15000,
  });

  const html = response.data;
  const imageRegex = /murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g;
  const matches = [...html.matchAll(imageRegex)];

  const seen = new Set<string>();
  const images: ScrapedImage[] = [];

  for (const match of matches) {
    const url = match[1];
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push({ url });
    }
    if (images.length >= limit) break;
  }

  return {
    query,
    totalFound: images.length,
    images,
  };
}
