import { NextResponse } from 'next/server'
import { getUnprocessedSourceRaws, insertExtract } from '@ghouse/supakit'
import { extractContent } from '@ghouse/extract'
import { createLogger } from '@ghouse/core'
import { notifyError, notifySuccess } from '@ghouse/report'

const logger = createLogger('api:extract')

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    logger.info('Starting extract job')

    const unprocessed = await getUnprocessedSourceRaws(50)

    let totalProcessed = 0

    for (const raw of unprocessed) {
      try {
        // Use Gemini for images/tables extraction
        const useGemini = raw.source_type === 'sns' || raw.source_type === 'prtimes'

        const extracted = await extractContent(raw.content, useGemini)

        await insertExtract({
          raw_id: raw.id,
          text: extracted.text,
          tables: extracted.tables,
          images: extracted.images,
          extractor: useGemini ? 'gemini' : 'rule',
          version: 'v1',
        })

        totalProcessed++
      } catch (error) {
        logger.error({ error, rawId: raw.id }, 'Failed to extract content')
      }
    }

    logger.info({ totalProcessed }, 'Extract job completed')

    await notifySuccess({
      job: '抽出処理 (Extract)',
      summary: `✅ 抽出処理が完了しました`,
      metrics: {
        '処理件数': totalProcessed,
      },
    })

    return NextResponse.json({
      success: true,
      totalProcessed,
    })
  } catch (error) {
    logger.error({ error }, 'Extract job failed')

    await notifyError({
      job: '抽出処理 (Extract)',
      error: error as Error,
      details: {
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
