import { NextResponse } from 'next/server'
import { insertAIOutput, getUsageMetrics, getRecentAIOutputs } from '@ghouse/supakit'
import { callClaude, getNewspaperPrompt } from '@ghouse/ai'
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

    // Get recent AI outputs (last 24 hours)
    const recentOutputs = await getRecentAIOutputs(24)

    // Aggregate data
    const classifications = recentOutputs.filter((o) => o.role === 'classify')
    const comparisons = recentOutputs.filter((o) => o.role === 'compare')
    const trends = recentOutputs.filter((o) => o.role === 'trend')
    const strategies = recentOutputs.filter((o) => o.role === 'strategy')

    // Build content sections
    const topStories = classifications
      .slice(0, 3)
      .map((c, i) => {
        const data = c.output_json as any
        return `### ${i + 1}. ${data.company || '情報'}\n${data.product || ''}\n${data.specs?.join(', ') || ''}`
      })
      .join('\n\n')

    const trendsText = trends[0]?.output_json
      ? JSON.stringify(trends[0].output_json, null, 2)
      : 'トレンドデータなし'

    const comparisonsText = comparisons
      .map((c) => c.output_md)
      .join('\n\n---\n\n')

    const strategiesText = strategies[0]?.output_json
      ? JSON.stringify(strategies[0].output_json, null, 2)
      : '戦略データなし'

    // Generate newspaper with Claude
    const newspaperPrompt = getNewspaperPrompt(
      topStories,
      trendsText,
      comparisonsText,
      strategiesText,
      today
    )

    const newspaperResponse = await callClaude(newspaperPrompt, {
      system: 'あなたは業界新聞の編集長です。',
      maxTokens: 8000,
    })

    // Save newspaper output
    await insertAIOutput({
      extract_id: classifications[0]?.extract_id || '00000000-0000-0000-0000-000000000000',
      role: 'newspaper',
      model: 'claude-3-haiku-20240307',
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
