import Parser from 'rss-parser';
import { createLogger } from '@ghouse/core';

const logger = createLogger('ingest:media');

export interface MediaArticle {
  url: string;
  title: string;
  content: string;
  publishedAt: string;
  source: string;
}

const parser = new Parser();

/**
 * Fetch articles from RSS feed
 */
export async function fetchRSS(feedUrl: string, sourceName: string): Promise<MediaArticle[]> {
  logger.info({ feedUrl, sourceName }, 'Fetching RSS feed');

  const articles: MediaArticle[] = [];

  try {
    const feed = await parser.parseURL(feedUrl);

    feed.items.forEach((item) => {
      if (item.link && item.title) {
        articles.push({
          url: item.link,
          title: item.title,
          content: item.contentSnippet || item.content || '',
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          source: sourceName,
        });
      }
    });

    logger.info({ count: articles.length, source: sourceName }, 'RSS feed fetched');
  } catch (error) {
    logger.error({ error, feedUrl }, 'Failed to fetch RSS feed');
  }

  return articles;
}

/**
 * Fetch 新建ハウジング RSS feed
 */
export async function fetchShinkenHousing(): Promise<MediaArticle[]> {
  return fetchRSS('https://www.s-housing.jp/feed/', '新建ハウジング');
}
