import { NextResponse } from 'next/server'
import { insertSourceRaw, getExistingUrls } from '@ghouse/supakit'
import { generateHash, createLogger } from '@ghouse/core'
import {
  fetchPRTimes,
  fetchPRTimesArticle,
  fetchShinkenHousing,
  fetchCompanyPages,
  fetchInstagramRSS,
} from '@ghouse/ingest'
import { notifyError, notifySuccess } from '@ghouse/report'
import companies from '../../../../config/companies.json'
import sources from '../../../../config/sources.json'

const logger = createLogger('api:crawl')

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    logger.info('Starting crawl job')

    let totalFetched = 0
    let totalSaved = 0
    let totalSkipped = 0

    // Get existing URLs to avoid re-crawling
    logger.info('Fetching existing URLs from database')
    const existingUrls = await getExistingUrls()
    logger.info({ existingUrlsCount: existingUrls.size }, 'Existing URLs loaded')

    // 1. PR TIMES
    for (const query of sources.pr_times_queries) {
      const articles = await fetchPRTimes(query, 10) // Increase limit to get more potential new articles

      for (const article of articles) {
        // Skip if URL already exists
        if (existingUrls.has(article.url)) {
          logger.debug({ url: article.url }, 'URL already exists, skipping')
          totalSkipped++
          continue
        }

        // Fetch full article content for new URLs only
        logger.info({ url: article.url }, 'Fetching new article content')
        const fullContent = await fetchPRTimesArticle(article.url)

        if (!fullContent) {
          logger.warn({ url: article.url }, 'Failed to fetch article content, skipping')
          continue
        }

        const content = `${article.title}\n\n${fullContent}`
        const hash = generateHash(content)

        const saved = await insertSourceRaw({
          source_type: 'prtimes',
          url: article.url,
          content,
          hash_sha256: hash,
          meta: {
            title: article.title,
            company: article.company,
            publishedAt: article.publishedAt,
          },
        })

        totalFetched++
        if (saved) totalSaved++
      }
    }

    // 2. Media (新建ハウジング)
    const mediaArticles = await fetchShinkenHousing()

    for (const article of mediaArticles) {
      // Skip if URL already exists
      if (existingUrls.has(article.url)) {
        logger.debug({ url: article.url }, 'URL already exists, skipping')
        totalSkipped++
        continue
      }

      const content = `${article.title}\n\n${article.content}`
      const hash = generateHash(content)

      const saved = await insertSourceRaw({
        source_type: 'media',
        url: article.url,
        content,
        hash_sha256: hash,
        meta: {
          title: article.title,
          source: article.source,
          publishedAt: article.publishedAt,
        },
      })

      totalFetched++
      if (saved) totalSaved++
    }

    // 3. Company websites
    for (const company of companies) {
      const pages = await fetchCompanyPages(company)

      for (const page of pages) {
        // Skip if URL already exists
        if (existingUrls.has(page.url)) {
          logger.debug({ url: page.url }, 'URL already exists, skipping')
          totalSkipped++
          continue
        }

        const hash = generateHash(page.content)

        const saved = await insertSourceRaw({
          source_type: 'company',
          url: page.url,
          content: page.content,
          hash_sha256: hash,
          meta: {
            title: page.title,
            company: page.company,
          },
        })

        totalFetched++
        if (saved) totalSaved++
      }
    }

    // 4. Instagram RSS (if configured)
    if (sources.instagram_rss.urls && sources.instagram_rss.urls.length > 0) {
      for (const feedUrl of sources.instagram_rss.urls) {
        const posts = await fetchInstagramRSS(feedUrl)

        for (const post of posts) {
          // Skip if URL already exists
          if (existingUrls.has(post.url)) {
            logger.debug({ url: post.url }, 'URL already exists, skipping')
            totalSkipped++
            continue
          }

          const hash = generateHash(post.content)

          const saved = await insertSourceRaw({
            source_type: 'sns',
            url: post.url,
            content: post.content,
            hash_sha256: hash,
            meta: {
              title: post.title,
              platform: post.platform,
              hashtags: post.hashtags,
              publishedAt: post.publishedAt,
            },
          })

          totalFetched++
          if (saved) totalSaved++
        }
      }
    }

    logger.info({ totalFetched, totalSaved, totalSkipped }, 'Crawl job completed')

    // Send success notification
    await notifySuccess({
      job: 'データ収集 (Crawl)',
      summary: `✅ データ収集が完了しました（新情報のみ取得）`,
      metrics: {
        '新規取得': totalFetched,
        '保存成功': totalSaved,
        'スキップ（既存）': totalSkipped,
        '重複': totalFetched - totalSaved,
      },
    })

    return NextResponse.json({
      success: true,
      totalFetched,
      totalSaved,
      totalSkipped,
      duplicates: totalFetched - totalSaved,
    })
  } catch (error) {
    logger.error({ error }, 'Crawl job failed')

    // ⚠️ CRITICAL: Send error notification to Google Chat
    await notifyError({
      job: 'データ収集 (Crawl)',
      error: error as Error,
      details: {
        timestamp: new Date().toISOString(),
        companiesCount: companies.length,
        queriesCount: sources.pr_times_queries.length,
      },
    })

    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
