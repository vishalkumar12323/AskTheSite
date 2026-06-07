import { WebScraper } from "../features/web-scraper-tools.js";
import { logger } from "../logger/logger.js";

export const scrapeWebsite = async (url: string): Promise<string> => {
  logger.worker(`Starting scrape`, { url });

  const scraper = await WebScraper.create(url);
  const markdown = scraper.toMarkdown();

  logger.worker(`Scrape complete`, {
    url,
    title: scraper.getTitle(),
    contentLength: `${markdown.length} chars`,
  });

  return markdown;
};

