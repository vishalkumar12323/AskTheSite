import { chromium } from "playwright";
import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeWebsite = async (url: string): Promise<string> => {
  try {
    console.log('website url => ', url)
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();

    if (content && content.length > 200) {
      return content;
    }

    throw new Error("Playwright content too small, fallback to Cheerio");
  } catch (err) {
    const { data } = await axios.get(url, { timeout: 15_000 });
    const $ = cheerio.load(data);
    return $("body").text();
  }
};
