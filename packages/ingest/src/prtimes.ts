import axios from 'axios';
import * as cheerio from 'cheerio';
import { createLogger, sleep } from '@ghouse/core';

const logger = createLogger('ingest:prtimes');

export interface PRTimesArticle {
  url: string;
  title: string;
  content: string;
  publishedAt: string;
  company: string;
}

/**
 * Fetch PR TIMES articles by search query
 */
export async function fetchPRTimes(query: string, limit = 10): Promise<PRTimesArticle[]> {
  logger.info({ query, limit }, 'Fetching PR TIMES articles');

  const articles: PRTimesArticle[] = [];

  try {
    // PR TIMES search URL
    const searchUrl = `https://prtimes.jp/main/html/searchrlp/company_id/${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Parse article list
    $('.list-article li').each((i, elem) => {
      if (i >= limit) return;

      const $article = $(elem);
      const $link = $article.find('a').first();
      const url = $link.attr('href');
      const title = $link.find('h3').text().trim();
      const company = $article.find('.name').text().trim();
      const date = $article.find('time').attr('datetime') || '';

      if (url && title) {
        articles.push({
          url: url.startsWith('http') ? url : `https://prtimes.jp${url}`,
          title,
          content: '', // Will be fetched separately if needed
          publishedAt: date,
          company,
        });
      }
    });

    logger.info({ count: articles.length }, 'PR TIMES articles fetched');
  } catch (error) {
    logger.error({ error, query }, 'Failed to fetch PR TIMES articles');
  }

  return articles;
}

/**
 * Fetch full article content
 */
export async function fetchPRTimesArticle(url: string): Promise<string> {
  try {
    await sleep(500); // Rate limiting

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const content = $('.content-body').text().trim();

    return content;
  } catch (error) {
    logger.error({ error, url }, 'Failed to fetch PR TIMES article content');
    return '';
  }
}
