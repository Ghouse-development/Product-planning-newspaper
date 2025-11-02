import { NextResponse } from 'next/server'
import { getUnanalyzedExtracts, insertAIOutput, upsertTrendKPI } from '@ghouse/supakit'
import { callClaude, getClassifyPrompt, getComparePrompt, getTrendPrompt, getStrategyPrompt } from '@ghouse/ai'
import { createLogger, safeJsonParse, formatDateJST } from '@ghouse/core'

const logger = createLogger('api:analyze')

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    logger.info('Starting analyze job')

    const unanalyzed = await getUnanalyzedExtracts(30)

    let totalAnalyzed = 0

    for (const extract of unanalyzed) {
      try {
        // 1. Classify
        const classifyPrompt = getClassifyPrompt(extract.text)
        const classifyResponse = await callClaude(classifyPrompt, {
          system: 'あなたは住宅業界の専門アナリストです。',
        })

        const classification = safeJsonParse(classifyResponse.text, {}) as any

        await insertAIOutput({
          extract_id: extract.id,
          role: 'classify',
          model: 'claude-3-5-sonnet-20241022',
          output_md: null,
          output_json: classification,
          tokens_in: classifyResponse.tokens_in,
          tokens_out: classifyResponse.tokens_out,
          usd_cost: classifyResponse.usd_cost,
        })

        // 2. Compare (if applicable)
        if (classification.type === 'product' || classification.type === 'spec') {
          const comparePrompt = getComparePrompt(extract.text)
          const compareResponse = await callClaude(comparePrompt)

          await insertAIOutput({
            extract_id: extract.id,
            role: 'compare',
            model: 'claude-3-5-sonnet-20241022',
            output_md: compareResponse.text,
            output_json: null,
            tokens_in: compareResponse.tokens_in,
            tokens_out: compareResponse.tokens_out,
            usd_cost: compareResponse.usd_cost,
          })
        }

        // 3. Extract trend KPIs
        if (classification.topic_tags && Array.isArray(classification.topic_tags)) {
          for (const tag of classification.topic_tags) {
            await upsertTrendKPI({
              date: formatDateJST(),
              keyword: tag,
              source: extract.extractor === 'gemini' ? 'sns' : 'media',
              count: 1,
              meta: { company: classification.company || '' },
            })
          }
        }

        totalAnalyzed++
      } catch (error) {
        logger.error({ error, extractId: extract.id }, 'Failed to analyze extract')
      }
    }

    // 4. Generate trend analysis
    const trendPrompt = getTrendPrompt('Recent trend data')
    const trendResponse = await callClaude(trendPrompt)

    await insertAIOutput({
      extract_id: unanalyzed[0]?.id || '00000000-0000-0000-0000-000000000000',
      role: 'trend',
      model: 'claude-3-5-sonnet-20241022',
      output_md: null,
      output_json: safeJsonParse(trendResponse.text, {}),
      tokens_in: trendResponse.tokens_in,
      tokens_out: trendResponse.tokens_out,
      usd_cost: trendResponse.usd_cost,
    })

    // 5. Generate strategy
    const strategyPrompt = getStrategyPrompt('Combined insights')
    const strategyResponse = await callClaude(strategyPrompt)

    await insertAIOutput({
      extract_id: unanalyzed[0]?.id || '00000000-0000-0000-0000-000000000000',
      role: 'strategy',
      model: 'claude-3-5-sonnet-20241022',
      output_md: null,
      output_json: safeJsonParse(strategyResponse.text, {}),
      tokens_in: strategyResponse.tokens_in,
      tokens_out: strategyResponse.tokens_out,
      usd_cost: strategyResponse.usd_cost,
    })

    logger.info({ totalAnalyzed }, 'Analyze job completed')

    return NextResponse.json({
      success: true,
      totalAnalyzed,
    })
  } catch (error) {
    logger.error({ error }, 'Analyze job failed')
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
