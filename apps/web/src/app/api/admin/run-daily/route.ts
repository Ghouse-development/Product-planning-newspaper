import { NextResponse } from 'next/server'
import { createLogger } from '@ghouse/core'

const logger = createLogger('api:run-daily')

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * Run all daily tasks in sequence:
 * 1. Crawl - データ収集
 * 2. Extract - データ抽出
 * 3. Analyze - AI分析
 * 4. Report - 新聞生成・配信
 */
export async function GET() {
  return POST()
}

export async function POST() {
  try {
    logger.info('Starting daily run - all tasks in sequence')

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const results: any = {}

    // 1. Crawl - データ収集
    logger.info('Step 1/4: Running crawl...')
    const crawlResponse = await fetch(`${baseUrl}/api/admin/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    results.crawl = await crawlResponse.json()
    logger.info({ crawl: results.crawl }, 'Crawl completed')

    // 2. Extract - データ抽出
    logger.info('Step 2/4: Running extract...')
    const extractResponse = await fetch(`${baseUrl}/api/admin/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    results.extract = await extractResponse.json()
    logger.info({ extract: results.extract }, 'Extract completed')

    // 3. Analyze - AI分析
    logger.info('Step 3/4: Running analyze...')
    const analyzeResponse = await fetch(`${baseUrl}/api/admin/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    results.analyze = await analyzeResponse.json()
    logger.info({ analyze: results.analyze }, 'Analyze completed')

    // 4. Report - 新聞生成・配信
    logger.info('Step 4/4: Generating daily report...')
    const reportResponse = await fetch(`${baseUrl}/api/report/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    results.report = await reportResponse.json()
    logger.info({ report: results.report }, 'Report completed')

    logger.info('Daily run completed successfully')

    return NextResponse.json({
      success: true,
      message: 'All daily tasks completed',
      results,
    })
  } catch (error) {
    logger.error({ error }, 'Daily run failed')
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
