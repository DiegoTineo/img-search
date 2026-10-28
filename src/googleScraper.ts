import { Browser, Page } from 'playwright';

export interface GoogleImageItem {
  src: string;
  alt: string;
}

export interface GoogleQueryResult {
  query: string;
  totalFound: number;
  images: GoogleImageItem[];
}

export async function scrapeGoogleImages(browser: Browser, query: string, limit: number = 20): Promise<GoogleQueryResult> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&udm=2`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle Google Consent Dialog if present
    try {
      const consentButton = page.locator('button:has-text("Aceptar todo"), button:has-text("Accept all"), button:has-text("I agree")').first();
      if (await consentButton.isVisible({ timeout: 2500 })) {
        await consentButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // Consent modal did not appear
    }

    // Scroll to trigger lazy loading
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
      await page.waitForTimeout(800);
    }

    const images = await page.evaluate(({ max }) => {
      const results: { src: string; alt: string }[] = [];
      const seen = new Set<string>();

      const elements = Array.from(document.querySelectorAll('img'));
      for (const el of elements) {
        const src = el.src || el.getAttribute('data-src') || '';
        const alt = el.alt || '';

        if (src && !src.startsWith('data:image/svg') && !seen.has(src)) {
          seen.add(src);
          results.push({ src, alt });
        }
        if (results.length >= max) break;
      }
      return results;
    }, { max: limit });

    return {
      query,
      totalFound: images.length,
      images,
    };
  } finally {
    await context.close();
  }
}
