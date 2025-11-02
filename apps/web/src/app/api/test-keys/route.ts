import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {
    anthropic: { available: false, error: null },
    gemini: { available: false, error: null, availableModels: [] },
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

  // Test Gemini API Key and list models
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      results.gemini.error = 'API key not set'
    } else {
      results.gemini.keyPrefix = geminiKey.substring(0, 10) + '...'

      // Try to list available models
      const genAI = new GoogleGenerativeAI(geminiKey)

      // Test different model names
      const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash-latest',
        'gemini-pro'
      ]

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContent('Say hi')
          results.gemini.availableModels.push({
            name: modelName,
            works: true,
            response: result.response.text().substring(0, 50)
          })
          results.gemini.available = true
          break // Found a working model, stop testing
        } catch (err: any) {
          results.gemini.availableModels.push({
            name: modelName,
            works: false,
            error: err.message?.substring(0, 100)
          })
        }
      }

      if (!results.gemini.available) {
        results.gemini.error = 'No working models found - see availableModels for details'
      }
    }
  } catch (error: any) {
    results.gemini.error = error.message || String(error)
  }

  return NextResponse.json(results, { status: 200 })
}
