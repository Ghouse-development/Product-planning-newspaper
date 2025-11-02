import axios from 'axios';
import * as cheerio from 'cheerio';
import { Company, createLogger, sleep } from '@ghouse/core';

const logger = createLogger('ingest:company');

export interface CompanyPage {
  url: string;
  title: string;
  content: string;
  company: string;
}

/**
 * Fetch company website pages
 */
export async function fetchCompanyPages(company: Company): Promise<CompanyPage[]> {
  logger.info({ company: company.name }, 'Fetching company pages');

  const pages: CompanyPage[] = [];

  for (const path of company.paths) {
    try {
      await sleep(1000); // Rate limiting

      const url = `https://${company.domain}${path}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Remove script, style, nav, footer
      $('script, style, nav, footer, header').remove();

      const title = $('title').text().trim() || $('h1').first().text().trim();
      const content = $('body').text().trim().replace(/\s+/g, ' ');

      if (content) {
        pages.push({
          url,
          title,
          content: content.substring(0, 10000), // Limit content size
          company: company.name,
        });
      }
    } catch (error) {
      logger.error({ error, company: company.name, path }, 'Failed to fetch company page');
    }
  }

  logger.info({ company: company.name, count: pages.length }, 'Company pages fetched');

  return pages;
}
