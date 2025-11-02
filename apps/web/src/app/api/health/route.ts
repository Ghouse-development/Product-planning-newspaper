import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@ghouse/supakit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY,
        hasChatWebhook: !!process.env.CHAT_WEBHOOK_URL,
      },
      database: {
        connected: false,
        error: null as string | null,
      },
    }

    // Test Supabase connection
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('credit_balance').select('id').limit(1)

      if (error) {
        checks.database.error = error.message
        checks.status = 'degraded'
      } else {
        checks.database.connected = true
      }
    } catch (dbError) {
      checks.database.error = String(dbError)
      checks.status = 'degraded'
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503

    return NextResponse.json(checks, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
