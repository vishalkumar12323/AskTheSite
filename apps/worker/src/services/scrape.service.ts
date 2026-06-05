import { WebScraper } from "../features/web-scraper-tools.js";

export const scrapeWebsite = async (url: string): Promise<string> => {
  console.log(`🌐 Starting scrape for: ${url}`);

  const scraper = await WebScraper.create(url);
  const markdown = scraper.toMarkdown();

  console.log(
    `📄 Scraped "${scraper.getTitle()}" — ${markdown.length} chars of structured content`
  );

  return markdown;
};
