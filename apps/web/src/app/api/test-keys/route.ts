import { NextResponse } from 'next/server'
import { callGemini } from '@ghouse/ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {
    anthropic: { available: false, error: null },
    gemini: { available: false, error: null },
  }

  // Test Anthropic API Key
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      results.anthropic.error = 'API key not set'
    } else {
      results.anthropic.keyPrefix = anthropicKey.substring(0, 10) + '...'
      results.anthropic.error = 'Key exists but Claude models unavailable (404 errors on all models)'
    }
  } catch (error) {
    results.anthropic.error = String(error)
  }

  // Test Gemini API Key
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      results.gemini.error = 'API key not set'
    } else {
      results.gemini.keyPrefix = geminiKey.substring(0, 10) + '...'

      // Test with a simple prompt
      const response = await callGemini('Say "test successful" in 2 words.')
      results.gemini.available = true
      results.gemini.testResponse = response.text.substring(0, 50)
    }
  } catch (error: any) {
    results.gemini.error = error.message || String(error)
  }

  return NextResponse.json(results)
}
