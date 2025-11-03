import { NextResponse } from 'next/server'
import { insertAIOutput, getUsageMetrics, getRecentAIOutputsWithSource } from '@ghouse/supakit'
import { callGemini, getNewspaperPrompt } from '@ghouse/ai'
import { generateNewspaperHTML, generateChatSummary, sendDailyReport } from '@ghouse/report'
import { createLogger, formatDateJST } from '@ghouse/core'

const logger = createLogger('api:report:daily')

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    logger.info('Starting daily report generation')

    const today = formatDateJST()

    // Get recent AI outputs with source URL information (last 24 hours)
    const recentOutputs = await getRecentAIOutputsWithSource(24)

    // Aggregate data
    const classifications = recentOutputs.filter((o) => o.role === 'classify')
    const comparisons = recentOutputs.filter((o) => o.role === 'compare')
    const trends = recentOutputs.filter((o) => o.role === 'trend')
    const strategies = recentOutputs.filter((o) => o.role === 'strategy')

    // Build content sections with URL and source information
    const topStories = classifications
      .slice(0, 5)
      .map((c, i) => {
        const data = c.output_json as any
        const sourceType = c.source_type || 'web'
        const sourceLabel = sourceType === 'sns' ? 'SNS' : sourceType === 'media' ? 'メディア' : 'Web'

        return `### ${i + 1}. 【${data.company || '不明'}】${data.product || data.type || '情報'}\n**発信元**: ${sourceLabel}\n**URL**: ${c.source_url || 'URL取得中'}\n**商品・サービス**: ${data.product || 'N/A'}\n**価格帯**: ${data.price_band || 'N/A'}\n**主な仕様**: ${data.specs?.join(', ') || 'N/A'}\n**関連タグ**: ${data.topic_tags?.join(', ') || 'N/A'}`
      })
      .join('\n\n---\n\n')

    const trendsText = trends[0]?.output_json
      ? JSON.stringify(trends[0].output_json, null, 2)
      : 'トレンドデータなし'

    const comparisonsText = comparisons
      .map((c) => c.output_md)
      .join('\n\n---\n\n')

    const strategiesText = strategies[0]?.output_json
      ? JSON.stringify(strategies[0].output_json, null, 2)
      : '戦略データなし'

    // Generate newspaper with Gemini
    const newspaperPrompt = getNewspaperPrompt(
      topStories,
      trendsText,
      comparisonsText,
      strategiesText,
      today
    )

    const newspaperResponse = await callGemini(newspaperPrompt)

    // Save newspaper output
    await insertAIOutput({
      extract_id: classifications[0]?.extract_id || '00000000-0000-0000-0000-000000000000',
      role: 'newspaper',
      model: 'gemini-2.5-flash',
      output_md: newspaperResponse.text,
      output_json: null,
      tokens_in: newspaperResponse.tokens_in,
      tokens_out: newspaperResponse.tokens_out,
      usd_cost: newspaperResponse.usd_cost,
    })

    // Generate HTML
    const html = await generateNewspaperHTML(newspaperResponse.text)

    // Get metrics and generate summary
    const metrics = await getUsageMetrics()
    const summary = generateChatSummary(newspaperResponse.text, metrics)

    // Send to Google Chat
    const webUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/newspaper`
      : 'http://localhost:3000/newspaper'

    await sendDailyReport(summary, undefined, webUrl)

    logger.info('Daily report generated and sent')

    return NextResponse.json({
      success: true,
      newspaper: newspaperResponse.text.substring(0, 500) + '...',
      metrics,
    })
  } catch (error) {
    logger.error({ error }, 'Daily report generation failed')
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
