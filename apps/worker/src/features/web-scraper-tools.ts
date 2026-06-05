import { chromium, type Browser, type Page } from "playwright";
import axios from "axios";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

// ─── Types ───────────────────────────────────────────────────────────

interface HeadingEntry {
  level: number;
  text: string;
}

interface LinkEntry {
  text: string;
  href: string;
}

interface ImageEntry {
  alt: string;
  src: string;
}

export interface IWebScraperData {
  url: string;
  title: string;
  metaDescription: string;
  ogImage: string;
  favicon: string;
  headings: HeadingEntry[];
  mainContent: string;
  links: LinkEntry[];
  images: ImageEntry[];
  navigationLinks: LinkEntry[];
  loginLink: string;
  signupLink: string;
  language: string;
  scrapedAt: Date;
}

// ─── Constants ───────────────────────────────────────────────────────

const PLAYWRIGHT_TIMEOUT = 30_000;
const AXIOS_TIMEOUT = 15_000;
const MAX_SCROLL_ATTEMPTS = 5;
const SCROLL_DELAY_MS = 300;

/** Elements whose text content is noise, not page content */
const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "canvas",
  "video",
  "audio",
  "form",
  "[aria-hidden='true']",
  ".cookie-banner",
  ".cookie-consent",
  "#cookie-banner",
  "#cookie-consent",
  ".ad",
  ".ads",
  ".advertisement",
  ".popup",
  ".modal",
  ".overlay",
  ".chat-widget",
  ".social-share",
  ".newsletter-signup",
];

/** Patterns that indicate login/signup links */
const LOGIN_PATTERNS = [
  /log\s*in/i,
  /sign\s*in/i,
  /login/i,
  /signin/i,
  /authenticate/i,
];

const SIGNUP_PATTERNS = [
  /sign\s*up/i,
  /register/i,
  /signup/i,
  /create\s*account/i,
  /get\s*started/i,
  /join/i,
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── WebScraper Class ────────────────────────────────────────────────

class WebScraper {
  private url: string;
  private data: IWebScraperData;
  private scraped: boolean = false;

  /**
   * Use `WebScraper.create(url)` instead — constructors can't be async.
   */
  private constructor(url: string) {
    this.url = this.normalizeUrl(url);
    this.data = this.emptyData();
  }

  /**
   * Async factory: creates a WebScraper and runs the scrape pipeline.
   */
  static async create(url: string): Promise<WebScraper> {
    const instance = new WebScraper(url);
    await instance.scrape();
    return instance;
  }

  // ─── Main scrape orchestrator ────────────────────────────────────

  private async scrape(): Promise<void> {
    try {
      console.log(`🔍 Scraping (Playwright): ${this.url}`);
      const html = await this.scrapeWithPlaywright();
      this.extractDataFromHtml(html);
      this.scraped = true;
      console.log(`✅ Playwright scrape succeeded for ${this.url}`);
    } catch (pwError: any) {
      console.warn(
        `⚠️ Playwright failed: ${pwError.message} — falling back to Cheerio`
      );
      try {
        const html = await this.scrapeWithCheerio();
        this.extractDataFromHtml(html);
        this.scraped = true;
        console.log(`✅ Cheerio fallback succeeded for ${this.url}`);
      } catch (cheerioError: any) {
        console.error(`❌ Both scraping strategies failed for ${this.url}`);
        throw new Error(
          `Scraping failed for ${this.url}: Playwright(${pwError.message}), Cheerio(${cheerioError.message})`
        );
      }
    }
  }

  // ─── Playwright Strategy ─────────────────────────────────────────

  private async scrapeWithPlaywright(): Promise<string> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const context = await browser.newContext({
        userAgent: USER_AGENT,
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
      });

      const page: Page = await context.newPage();

      // Block heavy resources to speed up scraping
      await page.route(
        /\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|mp4|mp3|avi|mov)$/i,
        (route) => route.abort()
      );

      await page.goto(this.url, {
        waitUntil: "domcontentloaded",
        timeout: PLAYWRIGHT_TIMEOUT,
      });

      // Wait a moment for JS hydration
      await page.waitForTimeout(1500);

      // Auto-scroll to trigger lazy-loaded content
      await this.autoScroll(page);

      const html = await page.content();
      await browser.close();
      browser = null;

      if (!html || html.length < 200) {
        throw new Error("Page content too small — likely empty or blocked");
      }

      return html;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Scrolls the page incrementally to trigger lazy-loaded content.
   */
  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(
      async ({ maxAttempts, delay }) => {
        await new Promise<void>((resolve) => {
          let scrollCount = 0;
          let lastScrollHeight = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, window.innerHeight);
            scrollCount++;

            if (
              scrollCount >= maxAttempts ||
              scrollHeight === lastScrollHeight
            ) {
              clearInterval(timer);
              window.scrollTo(0, 0); // scroll back to top
              resolve();
            }
            lastScrollHeight = scrollHeight;
          }, delay);
        });
      },
      { maxAttempts: MAX_SCROLL_ATTEMPTS, delay: SCROLL_DELAY_MS }
    );
  }

  // ─── Cheerio Strategy ────────────────────────────────────────────

  private async scrapeWithCheerio(): Promise<string> {
    const { data } = await axios.get<string>(this.url, {
      timeout: AXIOS_TIMEOUT,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 5,
    });

    if (!data || data.length < 100) {
      throw new Error("HTTP response too small — likely blocked or empty");
    }

    return data;
  }

  // ─── Shared Extraction Logic ─────────────────────────────────────

  private extractDataFromHtml(html: string): void {
    const $ = cheerio.load(html);

    this.data = {
      url: this.url,
      title: this.extractTitle($),
      metaDescription: this.extractMeta($, "description"),
      ogImage:
        this.extractMeta($, "og:image", "property") ||
        this.extractMeta($, "twitter:image", "name"),
      favicon: this.extractFavicon($),
      headings: this.extractHeadings($),
      mainContent: this.extractMainContent($),
      links: this.extractLinks($),
      images: this.extractImages($),
      navigationLinks: this.extractNavigationLinks($),
      loginLink: "",
      signupLink: "",
      language: $("html").attr("lang") || "en",
      scrapedAt: new Date(),
    };

    // Find auth links from all collected links
    const authLinks = this.findAuthLinks($);
    this.data.loginLink = authLinks.login;
    this.data.signupLink = authLinks.signup;
  }

  // ─── Individual Extractors ───────────────────────────────────────

  private extractTitle($: CheerioAPI): string {
    return (
      this.cleanText($("title").first().text()) ||
      this.cleanText($('meta[property="og:title"]').attr("content") || "") ||
      this.cleanText($("h1").first().text()) ||
      ""
    );
  }

  private extractMeta(
    $: CheerioAPI,
    name: string,
    attr: string = "name"
  ): string {
    return (
      $(`meta[${attr}="${name}"]`).attr("content") ||
      $(`meta[${attr}="${name.toLowerCase()}"]`).attr("content") ||
      ""
    );
  }

  private extractFavicon($: CheerioAPI): string {
    const iconLink =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      "/favicon.ico";
    return this.resolveUrl(iconLink);
  }

  private extractHeadings($: CheerioAPI): HeadingEntry[] {
    const headings: HeadingEntry[] = [];

    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const tagName = $(el).prop("tagName")?.toLowerCase() || "";
      const level = parseInt(tagName.replace("h", ""), 10);
      const text = this.cleanText($(el).text());

      if (text && text.length > 1 && text.length < 500) {
        headings.push({ level, text });
      }
    });

    return headings;
  }

  private extractMainContent($: CheerioAPI): string {
    // Remove noise elements
    const $clone = cheerio.load($.html() || "");
    NOISE_SELECTORS.forEach((sel) => $clone(sel).remove());

    // Try semantic content containers first
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      "#content",
      "#main-content",
      ".main-content",
      ".post-content",
      ".article-content",
      ".entry-content",
      ".page-content",
    ];

    for (const selector of contentSelectors) {
      const $el = $clone(selector);
      if ($el.length > 0) {
        const text = this.cleanText($el.text());
        if (text.length > 100) {
          return text;
        }
      }
    }

    // Remove navigation, footer, header, sidebar noise from body
    $clone("nav, footer, header, aside, .sidebar, .footer, .header").remove();

    const bodyText = this.cleanText($clone("body").text());
    return bodyText;
  }

  private extractLinks($: CheerioAPI): LinkEntry[] {
    const links: LinkEntry[] = [];
    const seen = new Set<string>();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = this.cleanText($(el).text());

      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      const resolvedHref = this.resolveUrl(href);

      if (text && text.length > 1 && text.length < 200 && !seen.has(resolvedHref)) {
        seen.add(resolvedHref);
        links.push({ text, href: resolvedHref });
      }
    });

    return links;
  }

  private extractImages($: CheerioAPI): ImageEntry[] {
    const images: ImageEntry[] = [];
    const seen = new Set<string>();

    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      const alt = $(el).attr("alt") || "";

      if (!src || src.startsWith("data:")) return;

      const resolvedSrc = this.resolveUrl(src);

      if (!seen.has(resolvedSrc)) {
        seen.add(resolvedSrc);
        images.push({
          alt: this.cleanText(alt),
          src: resolvedSrc,
        });
      }
    });

    return images;
  }

  private extractNavigationLinks($: CheerioAPI): LinkEntry[] {
    const navLinks: LinkEntry[] = [];
    const seen = new Set<string>();

    $("nav a[href], header a[href], [role='navigation'] a[href]").each(
      (_, el) => {
        const href = $(el).attr("href") || "";
        const text = this.cleanText($(el).text());

        if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
          return;
        }

        const resolvedHref = this.resolveUrl(href);

        if (text && text.length > 1 && !seen.has(resolvedHref)) {
          seen.add(resolvedHref);
          navLinks.push({ text, href: resolvedHref });
        }
      }
    );

    return navLinks;
  }

  private findAuthLinks($: CheerioAPI): {
    login: string;
    signup: string;
  } {
    let login = "";
    let signup = "";

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = ($(el).text() || "").trim().toLowerCase();
      const fullString = `${text} ${href}`.toLowerCase();

      if (!login) {
        for (const pattern of LOGIN_PATTERNS) {
          if (pattern.test(fullString)) {
            login = this.resolveUrl(href);
            break;
          }
        }
      }

      if (!signup) {
        for (const pattern of SIGNUP_PATTERNS) {
          if (pattern.test(fullString)) {
            signup = this.resolveUrl(href);
            break;
          }
        }
      }
    });

    return { login, signup };
  }

  // ─── Utilities ───────────────────────────────────────────────────

  private cleanText(text: string): string {
    return text
      .replace(/[\t\r]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/ {2,}/g, " ")
      .replace(/\u00A0/g, " ") // non-breaking space
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
      .trim();
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(
        url.startsWith("http") ? url : `https://${url}`
      );
      return parsed.href;
    } catch {
      return url;
    }
  }

  private resolveUrl(href: string): string {
    try {
      return new URL(href, this.url).href;
    } catch {
      return href;
    }
  }

  // ─── Output: LLM-Optimized Markdown ─────────────────────────────

  /**
   * Converts all extracted data into a structured Markdown document
   * optimized for consumption by Google Gemini.
   */
  toMarkdown(): string {
    const d = this.data;
    const sections: string[] = [];

    // Title + Metadata
    sections.push(`# ${d.title || "Untitled Page"}`);
    sections.push("");
    sections.push(`**URL:** ${d.url}`);
    if (d.metaDescription) {
      sections.push(`**Description:** ${d.metaDescription}`);
    }
    if (d.language) {
      sections.push(`**Language:** ${d.language}`);
    }
    sections.push(`**Scraped At:** ${d.scrapedAt.toISOString()}`);
    sections.push("");

    // Headings hierarchy
    if (d.headings.length > 0) {
      sections.push("## Page Structure");
      sections.push("");
      for (const h of d.headings) {
        const prefix = "#".repeat(Math.min(h.level + 1, 6)); // offset by 1 since our doc starts at h1
        sections.push(`${prefix} ${h.text}`);
      }
      sections.push("");
    }

    // Main content — this is the most important section for the LLM
    if (d.mainContent) {
      sections.push("## Main Content");
      sections.push("");
      sections.push(d.mainContent);
      sections.push("");
    }

    // Auth links
    if (d.loginLink || d.signupLink) {
      sections.push("## Authentication");
      sections.push("");
      if (d.loginLink) sections.push(`- **Login:** ${d.loginLink}`);
      if (d.signupLink) sections.push(`- **Sign Up:** ${d.signupLink}`);
      sections.push("");
    }

    // Navigation
    if (d.navigationLinks.length > 0) {
      sections.push("## Navigation");
      sections.push("");
      for (const link of d.navigationLinks.slice(0, 30)) {
        sections.push(`- [${link.text}](${link.href})`);
      }
      sections.push("");
    }

    // Important links (limit to keep within token budget)
    if (d.links.length > 0) {
      sections.push("## Links Found");
      sections.push("");
      for (const link of d.links.slice(0, 50)) {
        sections.push(`- [${link.text}](${link.href})`);
      }
      sections.push("");
    }

    // Images
    if (d.images.length > 0) {
      sections.push("## Images");
      sections.push("");
      for (const img of d.images.slice(0, 20)) {
        const label = img.alt || "image";
        sections.push(`- ![${label}](${img.src})`);
      }
      sections.push("");
    }

    return sections.join("\n");
  }

  // ─── Public Getters ──────────────────────────────────────────────

  getData(): IWebScraperData {
    return { ...this.data };
  }

  getMainContent(): string {
    return this.data.mainContent;
  }

  getLoginLink(): string {
    return this.data.loginLink;
  }

  getSignupLink(): string {
    return this.data.signupLink;
  }

  getTitle(): string {
    return this.data.title;
  }

  isScraped(): boolean {
    return this.scraped;
  }

  private emptyData(): IWebScraperData {
    return {
      url: this.url,
      title: "",
      metaDescription: "",
      ogImage: "",
      favicon: "",
      headings: [],
      mainContent: "",
      links: [],
      images: [],
      navigationLinks: [],
      loginLink: "",
      signupLink: "",
      language: "en",
      scrapedAt: new Date(),
    };
  }
}

export { WebScraper };
export type { IWebScraperData as IWebScraperDataType };