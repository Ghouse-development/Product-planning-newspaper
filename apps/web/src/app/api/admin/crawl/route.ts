import { NextResponse } from 'next/server'
import { insertSourceRaw } from '@ghouse/supakit'
import { generateHash, createLogger } from '@ghouse/core'
import {
  fetchPRTimes,
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

    // 1. PR TIMES
    for (const query of sources.pr_times_queries) {
      const articles = await fetchPRTimes(query, 5)

      for (const article of articles) {
        const content = `${article.title}\n\n${article.content}`
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

    logger.info({ totalFetched, totalSaved }, 'Crawl job completed')

    // Send success notification
    await notifySuccess({
      job: 'データ収集 (Crawl)',
      summary: `✅ データ収集が完了しました`,
      metrics: {
        '取得件数': totalFetched,
        '保存件数': totalSaved,
        '重複': totalFetched - totalSaved,
      },
    })

    return NextResponse.json({
      success: true,
      totalFetched,
      totalSaved,
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
