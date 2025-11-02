import Parser from 'rss-parser';
import { createLogger } from '@ghouse/core';

const logger = createLogger('ingest:sns');

export interface SNSPost {
  url: string;
  title: string;
  content: string;
  publishedAt: string;
  platform: string;
  hashtags: string[];
}

const parser = new Parser();

/**
 * Fetch Instagram posts via RSS (rss.app)
 * User should configure RSS feed URLs in sources.json
 */
export async function fetchInstagramRSS(feedUrl: string): Promise<SNSPost[]> {
  logger.info({ feedUrl }, 'Fetching Instagram RSS');

  const posts: SNSPost[] = [];

  try {
    const feed = await parser.parseURL(feedUrl);

    feed.items.forEach((item) => {
      if (item.link && item.title) {
        // Extract hashtags from content
        const content = item.contentSnippet || item.content || '';
        const hashtags = content.match(/#[^\s#]+/g) || [];

        posts.push({
          url: item.link,
          title: item.title,
          content,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          platform: 'instagram',
          hashtags: hashtags.map((tag) => tag.replace('#', '')),
        });
      }
    });

    logger.info({ count: posts.length }, 'Instagram RSS fetched');
  } catch (error) {
    logger.error({ error, feedUrl }, 'Failed to fetch Instagram RSS');
  }

  return posts;
}

/**
 * Fetch X (Twitter) posts
 * Requires X_BEARER_TOKEN if using API
 * For now, this is a placeholder
 */
export async function fetchXPosts(query: string): Promise<SNSPost[]> {
  logger.warn('X (Twitter) API integration not implemented yet');
  return [];
}

/**
 * Fetch YouTube videos
 * Requires YOUTUBE_API_KEY
 * For now, this is a placeholder
 */
export async function fetchYouTubeVideos(channelId: string): Promise<SNSPost[]> {
  logger.warn('YouTube API integration not implemented yet');
  return [];
}
