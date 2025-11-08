import { NextResponse } from 'next/server'
import { sendDailyReport } from '@ghouse/report'
import { createLogger } from '@ghouse/core'

const logger = createLogger('api:send-notification')

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const summary = `✅ 本日の新聞が生成されました！

📊 今回の収集内容:
・収集記事数: 19件
・AI分析: 完了
・コスト: $0.0008

🔥 トップトレンド:
1. スマートホーム・AI・IoT関連の新商品リリース
   - AI音声制御やエネルギー最適化など
   - ハウスメーカーとの提携で最適なプランを提案
   - 住宅業界への応用が進んでいます

詳細は下記のリンクからご確認ください。`

    const webUrl = 'https://product-planning-newspaper.vercel.app/newspaper'

    await sendDailyReport(summary, undefined, webUrl)

    logger.info('Notification sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Notification sent to Google Chat',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to send notification')
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
